package com.ems.service;

import com.ems.dto.PayrollProcessDTO;
import com.ems.exception.BadRequestException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.*;
import com.ems.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayrollService {

    private final PayslipRepository payslipRepository;
    private final PayrollProcessRepository payrollProcessRepository;
    private final SalaryRepository salaryRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final SalaryMasterRepository salaryMasterRepository;
    private final SalaryMasterHistoryRepository salaryMasterHistoryRepository;

    /**
     * Process payroll for a given month/year.
     * Attendance cycle: 26th of previous month to 25th of current month.
     */
    @Transactional
    public PayrollProcessDTO processPayroll(Integer year, Integer month) {
        // Check if already completed for this period
        var existingOpt = payrollProcessRepository.findByProcessYearAndProcessMonth(year, month);
        if (existingOpt.isPresent() && "COMPLETED".equals(existingOpt.get().getStatus())) {
            throw new BadRequestException("Payroll already processed for " + month + "/" + year);
        }

        // Create payroll process record
        PayrollProcess process = PayrollProcess.builder()
            .processYear(year)
            .processMonth(month)
            .status("PROCESSING")
            .startedAt(LocalDateTime.now())
            .build();
        process = payrollProcessRepository.save(process);

        List<Employee> employees = employeeRepository.findAllLiveEmployees();
        int total = employees.size();
        int processed = 0;
        List<String> errors = new ArrayList<>();

        // Calculate attendance period: 26th of prev month to 25th of current month
        LocalDate cycleStart, cycleEnd;
        if (month == 1) {
            cycleStart = LocalDate.of(year - 1, 12, 26);
            cycleEnd = LocalDate.of(year, 1, 25);
        } else {
            cycleStart = LocalDate.of(year, month - 1, 26);
            cycleEnd = LocalDate.of(year, month, 25);
        }

        for (Employee emp : employees) {
            try {
                // Find or create Salary record for this period
                Salary salary = salaryRepository
                    .findByEmployeeIdAndWageYearAndWageMonth(emp.getId(), year, month)
                    .orElseGet(() -> Salary.builder()
                        .employee(emp)
                        .wageMonth(month)
                        .wageYear(year)
                        .build());

                // Apply structural fields from SalaryMaster (preserves monthly adjustments)
                salaryMasterRepository.findByEmployeeId(emp.getId()).ifPresent(master -> applyMaster(salary, master));
                salary.computeDerivedFields();
                salaryRepository.save(salary);

                // Get attendance for the cycle
                List<AttendanceRecord> attendance = attendanceRepository
                    .findByEmployeeIdAndAttendanceDateBetween(emp.getId(), cycleStart, cycleEnd);

                int presentDays = (int) attendance.stream().filter(a -> "P".equals(a.getStatus())).count();
                int absentDays = (int) attendance.stream().filter(a -> "A".equals(a.getStatus())).count();
                int leaveDays = (int) attendance.stream().filter(a ->
                    "L".equals(a.getStatus()) || "ML".equals(a.getStatus())).count();
                int totalWorkingDays = attendance.size();

                // Compute total deductions
                BigDecimal totalDeductions = safe(salary.getPfDeduction())
                    .add(safe(salary.getEsiDeduction()))
                    .add(safe(salary.getPtDeduction()));

                // Create payslip snapshot
                Payslip payslip = Payslip.builder()
                    .employee(emp)
                    .wageMonth(month)
                    .wageYear(year)
                    .basic(safe(salary.getBasic()))
                    .hra(safe(salary.getHra()))
                    .fixedPersonalAllowance(safe(salary.getFixedPersonalAllowance()))
                    .otherAllowance(safe(salary.getOtherAllowance()))
                    .bonus(safe(salary.getBonus()))
                    .appraisalAmount(safe(salary.getAppraisalAmount()))
                    .lateSittingAmount(safe(salary.getLateSittingAmount()))
                    .grossSalary(safe(salary.getGrossSalary()))
                    .pfDeduction(safe(salary.getPfDeduction()))
                    .esiDeduction(safe(salary.getEsiDeduction()))
                    .ptDeduction(safe(salary.getPtDeduction()))
                    .overtimeWages(safe(salary.getOvertimeWages()))
                    .totalDeductions(totalDeductions)
                    .netPay(safe(salary.getNetPay()))
                    .presentDays(presentDays)
                    .absentDays(absentDays)
                    .leaveDays(leaveDays)
                    .totalWorkingDays(totalWorkingDays)
                    .status("GENERATED")
                    .generatedAt(LocalDateTime.now())
                    .build();

                payslipRepository.save(payslip);
                processed++;
            } catch (Exception e) {
                log.error("Error processing payroll for employee {}: {}", emp.getEmployeeCode(), e.getMessage());
                errors.add(emp.getEmployeeCode() + ": " + e.getMessage());
            }
        }

        // Update process record
        process.setStatus("COMPLETED");
        process.setTotalEmployees(total);
        process.setProcessedCount(processed);
        if (!errors.isEmpty()) {
            process.setErrorMessage(String.join("; ", errors));
        }
        process.setCompletedAt(LocalDateTime.now());
        payrollProcessRepository.save(process);

        log.info("Payroll processed for {}/{}: {}/{} employees", month, year, processed, total);
        return PayrollProcessDTO.fromEntity(process);
    }

    /**
     * Upload a Salary Statement Excel file, parse data rows, create Salary and Payslip records.
     * Expects the standard "Salary Statement" template format.
     */
    @Transactional
    public Map<String, Object> uploadSalaryStatement(MultipartFile file, Integer year, Integer month) {
        int totalRows = 0;
        int successCount = 0;
        int failureCount = 0;
        List<Map<String, String>> errors = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int lastRowNum = sheet.getLastRowNum();

            for (int i = 11; i <= lastRowNum; i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String slNo = getCellString(row, 0);
                String name = getCellString(row, 1);
                String empCode = getCellString(row, 2);

                // Skip empty rows and Grand Total row
                if (empCode.isEmpty() && name.isEmpty()) continue;
                if ("Grand Total".equalsIgnoreCase(slNo) || "Grand Total".equalsIgnoreCase(name)) break;

                totalRows++;

                try {
                    // Look up employee
                    if (empCode.isEmpty()) {
                        failureCount++;
                        errors.add(Map.of("row", String.valueOf(i + 1), "message", "Employee Code empty"));
                        continue;
                    }
                    Employee employee = employeeRepository.findByEmployeeCode(empCode).orElse(null);
                    if (employee == null) {
                        failureCount++;
                        errors.add(Map.of("row", String.valueOf(i + 1), "message", "Employee not found: " + empCode));
                        continue;
                    }

                    // Parse numeric fields
                    BigDecimal basic = parseDecimal(getCellString(row, 9));
                    BigDecimal hra = parseDecimal(getCellString(row, 10));
                    BigDecimal fpa = parseDecimal(getCellString(row, 11));
                    BigDecimal oa = parseDecimal(getCellString(row, 12));
                    BigDecimal overtime = parseDecimal(getCellString(row, 17));
                    BigDecimal grossWages = parseDecimal(getCellString(row, 18));
                    BigDecimal pf = parseDecimal(getCellString(row, 19));
                    BigDecimal esi = parseDecimal(getCellString(row, 20));
                    BigDecimal pt = parseDecimal(getCellString(row, 21));
                    BigDecimal hi = parseDecimal(getCellString(row, 22));
                    BigDecimal actualWages = parseDecimal(getCellString(row, 23));

                    // Parse integer fields
                    Integer workingDays = parseInt(getCellString(row, 14));
                    Integer lop = parseInt(getCellString(row, 15));
                    Integer effWorkdays = parseInt(getCellString(row, 16));

                    // Parse date of payment
                    LocalDateTime dateOfPayment = parseDate(getCellString(row, 24));

                    // Find or create Salary record
                    Salary salary = salaryRepository
                        .findByEmployeeIdAndWageYearAndWageMonth(employee.getId(), year, month)
                        .orElseGet(() -> Salary.builder()
                            .employee(employee)
                            .wageMonth(month)
                            .wageYear(year)
                            .build());

                    // Set all fields from file, skip auto-computation
                    salary.setSkipComputation(true);
                    salary.setBasic(basic);
                    salary.setHra(hra);
                    salary.setFixedPersonalAllowance(fpa);
                    salary.setOtherAllowance(oa);
                    salary.setBonus(BigDecimal.ZERO);
                    salary.setAppraisalAmount(BigDecimal.ZERO);
                    salary.setLateSittingAmount(BigDecimal.ZERO);
                    salary.setGrossSalary(grossWages);
                    salary.setPfDeduction(pf);
                    salary.setEsiDeduction(esi);
                    salary.setPtDeduction(pt);
                    salary.setHealthInsurance(hi);
                    salary.setOvertimeWages(overtime);
                    salary.setNetPay(actualWages);
                    salary.setDateOfPayment(dateOfPayment);
                    salary.setWorkingHoursPerDay(8);
                    salary.setWeeklyOff("Allowed");
                    salary.setWorkerType("Permanent");
                    salaryRepository.save(salary);

                    // Create or update Payslip snapshot (avoid duplicates per employee+month+year)
                    BigDecimal totalDeductions = pf.add(esi).add(pt).add(hi);
                    Payslip payslip = payslipRepository
                        .findByEmployeeIdAndWageYearAndWageMonth(employee.getId(), year, month)
                        .orElseGet(() -> Payslip.builder()
                            .employee(employee)
                            .wageMonth(month)
                            .wageYear(year)
                            .build());
                    payslip.setBasic(basic);
                    payslip.setHra(hra);
                    payslip.setFixedPersonalAllowance(fpa);
                    payslip.setOtherAllowance(oa);
                    payslip.setBonus(BigDecimal.ZERO);
                    payslip.setAppraisalAmount(BigDecimal.ZERO);
                    payslip.setLateSittingAmount(BigDecimal.ZERO);
                    payslip.setGrossSalary(grossWages);
                    payslip.setPfDeduction(pf);
                    payslip.setEsiDeduction(esi);
                    payslip.setPtDeduction(pt);
                    payslip.setHealthInsurance(hi);
                    payslip.setOvertimeWages(overtime);
                    payslip.setTotalDeductions(totalDeductions);
                    payslip.setNetPay(actualWages);
                    payslip.setPresentDays(effWorkdays);
                    payslip.setAbsentDays(0);
                    payslip.setLeaveDays(lop);
                    payslip.setTotalWorkingDays(workingDays);
                    payslip.setLopDays(lop);
                    payslip.setEffectiveWorkdays(effWorkdays);
                    payslip.setStatus("GENERATED");
                    payslip.setGeneratedAt(LocalDateTime.now());
                    payslipRepository.save(payslip);
                    successCount++;

                } catch (Exception e) {
                    log.error("Error processing row {}: {}", i + 1, e.getMessage());
                    failureCount++;
                    errors.add(Map.of("row", String.valueOf(i + 1), "message", e.getMessage()));
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse uploaded Excel: {}", e.getMessage());
            throw new RuntimeException("Failed to parse uploaded Excel file", e);
        }

        log.info("Salary statement upload: {} total, {} success, {} failure", totalRows, successCount, failureCount);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRows", totalRows);
        result.put("successCount", successCount);
        result.put("failureCount", failureCount);
        result.put("errors", errors);
        return result;
    }

    private String getCellString(Row row, int idx) {
        Cell cell = row.getCell(idx);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                yield (val == Math.floor(val) && !Double.isInfinite(val))
                    ? String.valueOf((long) val)
                    : String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private BigDecimal parseDecimal(String val) {
        if (val == null || val.isBlank()) return BigDecimal.ZERO;
        try {
            return new BigDecimal(val.replaceAll(",", "").trim());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private Integer parseInt(String val) {
        if (val == null || val.isBlank()) return 0;
        try {
            return Integer.parseInt(val.replaceAll(",", "").trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private LocalDateTime parseDate(String val) {
        if (val == null || val.isBlank()) return null;
        val = val.trim();
        try {
            return LocalDate.parse(val, DateTimeFormatter.ofPattern("dd/MM/yyyy")).atStartOfDay();
        } catch (DateTimeParseException e) {
            try {
                return LocalDate.parse(val, DateTimeFormatter.ofPattern("yyyy-MM-dd")).atStartOfDay();
            } catch (DateTimeParseException e2) {
                try {
                    return LocalDate.parse(val, DateTimeFormatter.ofPattern("dd-MM-yyyy")).atStartOfDay();
                } catch (DateTimeParseException e3) {
                    return null;
                }
            }
        }
    }

    public PayrollProcessDTO getPayrollStatus(Integer year, Integer month) {
        PayrollProcess process = payrollProcessRepository.findByProcessYearAndProcessMonth(year, month)
            .orElseThrow(() -> new ResourceNotFoundException("No payroll process found for " + month + "/" + year));
        return PayrollProcessDTO.fromEntity(process);
    }

    public List<PayrollProcessDTO> getPayrollHistory(Integer year, Integer month) {
        List<PayrollProcess> processes;
        if (year != null && month != null) {
            processes = payrollProcessRepository.findByProcessYearAndProcessMonthOrderByCreatedAtDesc(year, month);
        } else if (year != null) {
            processes = payrollProcessRepository.findByProcessYearOrderByProcessMonthDesc(year);
        } else {
            processes = payrollProcessRepository.findAll();
        }
        return processes.stream()
            .map(PayrollProcessDTO::fromEntity)
            .collect(Collectors.toList());
    }

    /**
     * Batch upsert payroll inputs (salary adjustments) for HR.
     */
    @Transactional(noRollbackFor = Exception.class)
    public Map<String, Object> batchUpsertPayrollInputs(List<com.ems.dto.PayrollInputDTO.PayrollInputItem> inputs) {
        int success = 0;
        int failure = 0;
        List<String> errors = new ArrayList<>();

        for (var item : inputs) {
            try {
                Employee employee = employeeRepository.findById(item.getEmployeeId()).orElse(null);
                if (employee == null) {
                    failure++;
                    errors.add("Employee " + item.getEmployeeId() + ": not found");
                    continue;
                }

                Salary salary = salaryRepository
                    .findByEmployeeIdAndWageYearAndWageMonth(
                        item.getEmployeeId(), item.getWageYear(), item.getWageMonth())
                    .orElseGet(() -> Salary.builder()
                        .employee(employee)
                        .wageMonth(item.getWageMonth())
                        .wageYear(item.getWageYear())
                        .build());

                // Track changes only for existing records (has an ID)
                if (salary.getId() != null) {
                    String changedBy = getCurrentUser();
                    java.time.LocalDateTime now = java.time.LocalDateTime.now();
                    trackInputChange(salary.getId(), employee.getId(), employee.getEmployeeCode(),
                        "basic", salary.getBasic(), item.getBasic(), changedBy, now);
                    trackInputChange(salary.getId(), employee.getId(), employee.getEmployeeCode(),
                        "hra", salary.getHra(), item.getHra(), changedBy, now);
                    trackInputChange(salary.getId(), employee.getId(), employee.getEmployeeCode(),
                        "bonus", salary.getBonus(), item.getBonus(), changedBy, now);
                    trackInputChange(salary.getId(), employee.getId(), employee.getEmployeeCode(),
                        "appraisalAmount", salary.getAppraisalAmount(), item.getAppraisalAmount(), changedBy, now);
                    trackInputChange(salary.getId(), employee.getId(), employee.getEmployeeCode(),
                        "lateSittingAmount", salary.getLateSittingAmount(), item.getLateSittingAmount(), changedBy, now);
                    trackInputChange(salary.getId(), employee.getId(), employee.getEmployeeCode(),
                        "pfDeduction", salary.getPfDeduction(), item.getPfDeduction(), changedBy, now);
                    trackInputChange(salary.getId(), employee.getId(), employee.getEmployeeCode(),
                        "esiDeduction", salary.getEsiDeduction(), item.getEsiDeduction(), changedBy, now);
                    trackInputChange(salary.getId(), employee.getId(), employee.getEmployeeCode(),
                        "ptDeduction", salary.getPtDeduction(), item.getPtDeduction(), changedBy, now);
                    trackInputChange(salary.getId(), employee.getId(), employee.getEmployeeCode(),
                        "overtimeWages", salary.getOvertimeWages(), item.getOvertimeWages(), changedBy, now);
                }

                if (item.getBasic() != null) salary.setBasic(item.getBasic());
                if (item.getHra() != null) salary.setHra(item.getHra());
                if (item.getFixedPersonalAllowance() != null) salary.setFixedPersonalAllowance(item.getFixedPersonalAllowance());
                if (item.getOtherAllowance() != null) salary.setOtherAllowance(item.getOtherAllowance());
                if (item.getBonus() != null) salary.setBonus(item.getBonus());
                if (item.getAppraisalAmount() != null) salary.setAppraisalAmount(item.getAppraisalAmount());
                if (item.getLateSittingAmount() != null) salary.setLateSittingAmount(item.getLateSittingAmount());
                if (item.getPfDeduction() != null) salary.setPfDeduction(item.getPfDeduction());
                if (item.getEsiDeduction() != null) salary.setEsiDeduction(item.getEsiDeduction());
                if (item.getPtDeduction() != null) salary.setPtDeduction(item.getPtDeduction());
                if (item.getOvertimeWages() != null) salary.setOvertimeWages(item.getOvertimeWages());
                if (item.getWorkingHoursPerDay() != null) salary.setWorkingHoursPerDay(item.getWorkingHoursPerDay());
                if (item.getWeeklyOff() != null) salary.setWeeklyOff(item.getWeeklyOff());
                if (item.getWorkerType() != null) salary.setWorkerType(item.getWorkerType());

                salary.computeDerivedFields();
                salaryRepository.save(salary);
                success++;
            } catch (Exception e) {
                log.error("Error upserting payroll input for employee {}: {}", item.getEmployeeId(), e.getMessage());
                failure++;
                errors.add("Employee " + item.getEmployeeId() + ": " + e.getMessage());
            }
        }

        log.info("Batch upsert payroll inputs: {} success, {} failure", success, failure);
        return Map.of(
            "successCount", success,
            "failureCount", failure,
            "errors", errors
        );
    }

    public void deleteProcessRecord(Integer year, Integer month) {
        payrollProcessRepository.findByProcessYearAndProcessMonth(year, month)
            .ifPresent(p -> { payrollProcessRepository.delete(p); log.info("Deleted process record for {}/{}", month, year); });
    }

    @Transactional
    public int deleteSalaryRecords(Integer year, Integer month) {
        List<Salary> records = salaryRepository.findByWageYearAndWageMonth(year, month);
        salaryRepository.deleteAll(records);
        log.info("Deleted {} salary records for {}/{}", records.size(), month, year);
        return records.size();
    }

    private BigDecimal safe(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    private void trackInputChange(Long salaryMasterId, Long empId, String empCode, String field,
                                   BigDecimal oldVal, BigDecimal newVal, String user,
                                   java.time.LocalDateTime now) {
        if (oldVal == null && newVal == null) return;
        if (oldVal != null && newVal != null && oldVal.compareTo(newVal) == 0) return;
        if (newVal == null) return;
        salaryMasterHistoryRepository.save(com.ems.model.SalaryMasterHistory.builder()
            .salaryMasterId(salaryMasterId)
            .employeeId(empId)
            .employeeCode(empCode)
            .fieldName("monthly_" + field)
            .oldValue(oldVal != null ? oldVal.toPlainString() : null)
            .newValue(newVal.toPlainString())
            .changedBy(user)
            .changedAt(now)
            .build());
    }

    private String getCurrentUser() {
        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    private void applyMaster(Salary salary, com.ems.model.SalaryMaster master) {
        salary.setBasic(master.getBasic());
        salary.setHra(master.getHra());
        salary.setFixedPersonalAllowance(master.getFixedPersonalAllowance());
        salary.setOtherAllowance(master.getOtherAllowance());
        // Only copy structural fields — skip per-month adjustments (bonus, appraisal, lateSitting, overtime)
        salary.setPfDeduction(master.getPfDeduction());
        salary.setEsiDeduction(master.getEsiDeduction());
        salary.setPtDeduction(master.getPtDeduction());
        salary.setWorkingHoursPerDay(master.getWorkingHoursPerDay());
        salary.setWeeklyOff(master.getWeeklyOff());
        salary.setWorkerType(master.getWorkerType());
    }
}
