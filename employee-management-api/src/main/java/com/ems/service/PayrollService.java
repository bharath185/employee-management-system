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

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int lastRowNum = sheet.getLastRowNum();

            // Dynamically locate header row
            int headerRowIdx = -1;
            for (int r = 0; r <= Math.min(15, lastRowNum); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                for (int c = 0; c < row.getLastCellNum(); c++) {
                    String str = getCellString(row, c).toLowerCase();
                    if (str.contains("employee code") || str.contains("emp.code") || str.contains("rate of wages") || str.contains("name of the employee")) {
                        headerRowIdx = r;
                        break;
                    }
                }
                if (headerRowIdx != -1) break;
            }

            int dataStartRow = headerRowIdx != -1 ? headerRowIdx + 1 : 8;
            if (headerRowIdx != -1 && headerRowIdx + 1 <= lastRowNum) {
                Row nextRow = sheet.getRow(headerRowIdx + 1);
                if (nextRow != null) {
                    for (int c = 0; c < nextRow.getLastCellNum(); c++) {
                        String str = getCellString(nextRow, c).toLowerCase();
                        if (str.contains("basic") || str.contains("hra") || str.contains("pf") || str.contains("esi")) {
                            dataStartRow = headerRowIdx + 2;
                            break;
                        }
                    }
                }
            }

            int colEmpCode = 2;
            int colName = 1;
            int colSlNo = 0;
            int colDoj = 3;

            // Fixed Rate of wages (Set 1)
            int colRateBasic = 4;
            int colRateHra = 5;
            int colRateFpa = 6;
            int colRateOa = 7;
            int colRateGross = 8;

            // Actual / Normal earned wages (Set 2)
            int colEarnedBasic = 9;
            int colEarnedHra = 10;
            int colEarnedFpa = 11;
            int colEarnedOa = 12;
            int colEarnedGross = 13;

            // Workdays
            int colWorkingDays = 14;
            int colLop = 15;
            int colEffWorkdays = 16;
            int colOvertime = 17;
            int colGrossWages = 18;

            // Deductions & Pay
            int colPf = 19;
            int colEsi = 20;
            int colPt = 21;
            int colHi = -1;
            int colActualWages = -1;
            int colDateOfPayment = -1;

            Row h1 = headerRowIdx != -1 ? sheet.getRow(headerRowIdx) : null;
            Row h2 = (headerRowIdx != -1 && headerRowIdx + 1 <= lastRowNum) ? sheet.getRow(headerRowIdx + 1) : null;

            if (h1 != null) {
                int maxCols = Math.max(h1.getLastCellNum(), h2 != null ? h2.getLastCellNum() : 0);
                List<Integer> basicCols = new ArrayList<>();
                List<Integer> hraCols = new ArrayList<>();
                List<Integer> fpaCols = new ArrayList<>();
                List<Integer> oaCols = new ArrayList<>();
                List<Integer> grossCols = new ArrayList<>();

                for (int c = 0; c < maxCols; c++) {
                    String v1 = getCellString(h1, c).trim().toLowerCase();
                    String v2 = h2 != null ? getCellString(h2, c).trim().toLowerCase() : "";
                    String comb = (v1 + " " + v2).trim();

                    if (comb.contains("emp.code") || comb.contains("employee code") || comb.contains("emp code")) {
                        colEmpCode = c;
                    } else if (comb.contains("name of the employee") || comb.contains("employee name")) {
                        colName = c;
                    } else if (comb.contains("sl.no") || comb.contains("sl no") || comb.equals("s no") || comb.equals("sno")) {
                        colSlNo = c;
                    } else if (comb.contains("date of appointment") || comb.contains("appointment")) {
                        colDoj = c;
                    } else if (comb.contains("working day") && !comb.contains("effective")) {
                        colWorkingDays = c;
                    } else if (comb.contains("lop") || comb.contains("loss of pay")) {
                        colLop = c;
                    } else if (comb.contains("effective workday") || comb.contains("effective work day") || comb.contains("effective days")) {
                        colEffWorkdays = c;
                    } else if (comb.contains("overtime")) {
                        colOvertime = c;
                    } else if (comb.contains("gross wages payable") || (comb.contains("gross wages") && !comb.contains("rate"))) {
                        colGrossWages = c;
                    } else if (v2.equals("pf") || comb.equals("pf") || comb.contains("provident fund")) {
                        colPf = c;
                    } else if (v2.equals("esi") || comb.equals("esi")) {
                        colEsi = c;
                    } else if (v2.equals("pt") || comb.equals("pt") || comb.contains("prof tax") || comb.contains("professional tax")) {
                        colPt = c;
                    } else if (comb.contains("health insurance") || comb.contains("insurance")) {
                        colHi = c;
                    } else if (comb.contains("actual wages paid") || comb.contains("net pay") || comb.contains("net salary") || comb.contains("actual paid")) {
                        colActualWages = c;
                    } else if (comb.contains("date of payment") || comb.contains("payment date")) {
                        colDateOfPayment = c;
                    }

                    if (v2.equals("basic") || comb.endsWith("basic")) {
                        basicCols.add(c);
                    } else if (v2.equals("hra") || comb.endsWith("hra")) {
                        hraCols.add(c);
                    } else if (v2.contains("fixed personal") || comb.contains("fixed personal")) {
                        fpaCols.add(c);
                    } else if (v2.contains("oth. allowance") || v2.contains("other allowance") || comb.contains("other allowance")) {
                        oaCols.add(c);
                    } else if (v2.contains("gross salary") || comb.contains("gross salary")) {
                        grossCols.add(c);
                    }
                }

                if (basicCols.size() >= 2) {
                    colRateBasic = basicCols.get(0);
                    colEarnedBasic = basicCols.get(1);
                } else if (basicCols.size() == 1) {
                    colEarnedBasic = basicCols.get(0);
                }

                if (hraCols.size() >= 2) {
                    colRateHra = hraCols.get(0);
                    colEarnedHra = hraCols.get(1);
                } else if (hraCols.size() == 1) {
                    colEarnedHra = hraCols.get(0);
                }

                if (fpaCols.size() >= 2) {
                    colRateFpa = fpaCols.get(0);
                    colEarnedFpa = fpaCols.get(1);
                } else if (fpaCols.size() == 1) {
                    colEarnedFpa = fpaCols.get(0);
                }

                if (oaCols.size() >= 2) {
                    colRateOa = oaCols.get(0);
                    colEarnedOa = oaCols.get(1);
                } else if (oaCols.size() == 1) {
                    colEarnedOa = oaCols.get(0);
                }

                if (grossCols.size() >= 2) {
                    colRateGross = grossCols.get(0);
                    colEarnedGross = grossCols.get(1);
                } else if (grossCols.size() == 1) {
                    colEarnedGross = grossCols.get(0);
                }

                if (colActualWages == -1) {
                    if (colHi != -1) {
                        colActualWages = colHi + 1;
                    } else if (colPt != -1) {
                        colActualWages = colPt + 1;
                    } else {
                        colActualWages = 22;
                    }
                }
                if (colDateOfPayment == -1 && colActualWages != -1) {
                    colDateOfPayment = colActualWages + 1;
                }
            }

            // Preload lookup maps to avoid remote roundtrip per row
            List<Employee> allEmployees = employeeRepository.findAll();
            Map<String, Employee> empMap = new HashMap<>();
            for (Employee e : allEmployees) {
                if (e.getEmployeeCode() != null) {
                    String c = e.getEmployeeCode().toUpperCase().trim();
                    empMap.put(c, e);
                    empMap.put(normalizeCode(c), e);
                }
            }

            Map<Long, SalaryMaster> masterMap = new HashMap<>();
            for (SalaryMaster sm : salaryMasterRepository.findAll()) {
                if (sm.getEmployee() != null && sm.getEmployee().getId() != null) {
                    masterMap.put(sm.getEmployee().getId(), sm);
                }
            }

            Map<Long, Salary> salaryMap = new HashMap<>();
            for (Salary s : salaryRepository.findByWageYearAndWageMonth(year, month)) {
                if (s.getEmployee() != null && s.getEmployee().getId() != null) {
                    salaryMap.put(s.getEmployee().getId(), s);
                }
            }

            Map<Long, Payslip> payslipMap = new HashMap<>();
            for (Payslip p : payslipRepository.findByWageYearAndWageMonth(year, month)) {
                if (p.getEmployee() != null && p.getEmployee().getId() != null) {
                    payslipMap.put(p.getEmployee().getId(), p);
                }
            }

            Map<Long, SalaryMaster> mastersToSave = new HashMap<>();
            List<Salary> salariesToSave = new ArrayList<>();
            List<Payslip> payslipsToSave = new ArrayList<>();

            for (int i = dataStartRow; i <= lastRowNum; i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String slNo = getCellString(row, colSlNo).trim();
                String name = getCellString(row, colName).trim();
                String empCode = getCellString(row, colEmpCode).trim();

                // Skip note rows, empty rows, and Grand Total row
                if (slNo.toLowerCase().startsWith("note") || name.toLowerCase().startsWith("note")) break;
                if ("Grand Total".equalsIgnoreCase(slNo) || "Grand Total".equalsIgnoreCase(name) || "Grand Total".equalsIgnoreCase(empCode)) break;
                if (empCode.isEmpty() && name.isEmpty()) continue;

                totalRows++;

                try {
                    // Look up employee
                    if (empCode.isEmpty()) {
                        failureCount++;
                        errors.add(Map.of("row", String.valueOf(i + 1), "message", "Employee Code empty"));
                        continue;
                    }
                    String cleanCode = empCode.trim().toUpperCase();
                    Employee employee = empMap.get(cleanCode);
                    if (employee == null) {
                        employee = empMap.get(normalizeCode(cleanCode));
                    }
                    if (employee == null) {
                        failureCount++;
                        errors.add(Map.of("row", String.valueOf(i + 1), "message", "Employee not found: " + empCode));
                        continue;
                    }
                    final Employee finalEmp = employee;

                    // Parse rate of wages (fixed structure)
                    BigDecimal rateBasic = parseDecimal(getCellString(row, colRateBasic));
                    BigDecimal rateHra = parseDecimal(getCellString(row, colRateHra));
                    BigDecimal rateFpa = parseDecimal(getCellString(row, colRateFpa));
                    BigDecimal rateOa = parseDecimal(getCellString(row, colRateOa));
                    BigDecimal rateGross = parseDecimal(getCellString(row, colRateGross));

                    // Parse actual earned numeric fields
                    BigDecimal basic = parseDecimal(getCellString(row, colEarnedBasic));
                    BigDecimal hra = parseDecimal(getCellString(row, colEarnedHra));
                    BigDecimal fpa = parseDecimal(getCellString(row, colEarnedFpa));
                    BigDecimal oa = parseDecimal(getCellString(row, colEarnedOa));
                    BigDecimal earnedGross = parseDecimal(getCellString(row, colEarnedGross));

                    // Parse workdays and overtime
                    Integer workingDays = parseInt(getCellString(row, colWorkingDays));
                    Integer lop = parseInt(getCellString(row, colLop));
                    Integer effWorkdays = parseInt(getCellString(row, colEffWorkdays));
                    BigDecimal overtime = parseDecimal(getCellString(row, colOvertime));
                    BigDecimal grossWages = parseDecimal(getCellString(row, colGrossWages));

                    if (grossWages.compareTo(BigDecimal.ZERO) == 0 && earnedGross.compareTo(BigDecimal.ZERO) > 0) {
                        grossWages = earnedGross;
                    }

                    // Parse deductions
                    BigDecimal pf = parseDecimal(getCellString(row, colPf));
                    BigDecimal esi = parseDecimal(getCellString(row, colEsi));
                    BigDecimal pt = parseDecimal(getCellString(row, colPt));
                    BigDecimal hi = colHi != -1 ? parseDecimal(getCellString(row, colHi)) : BigDecimal.ZERO;
                    BigDecimal totalDeductions = pf.add(esi).add(pt).add(hi);

                    BigDecimal actualWages = parseDecimal(getCellString(row, colActualWages));
                    if (actualWages.compareTo(BigDecimal.ZERO) == 0 && grossWages.compareTo(BigDecimal.ZERO) > 0) {
                        actualWages = grossWages.subtract(totalDeductions);
                    }

                    // Parse date of payment
                    LocalDateTime dateOfPayment = colDateOfPayment != -1 ? parseDate(getCellString(row, colDateOfPayment)) : null;

                    // Sync SalaryMaster structure if rateGross > 0
                    if (rateGross.compareTo(BigDecimal.ZERO) > 0) {
                        SalaryMaster sm = masterMap.computeIfAbsent(finalEmp.getId(), id -> SalaryMaster.builder().employee(finalEmp).build());
                        sm.setBasic(rateBasic);
                        sm.setHra(rateHra);
                        sm.setFixedPersonalAllowance(rateFpa);
                        sm.setOtherAllowance(rateOa);
                        sm.setPfDeduction(pf);
                        sm.setEsiDeduction(esi);
                        sm.setPtDeduction(pt);
                        sm.setHealthInsurance(hi);
                        mastersToSave.put(finalEmp.getId(), sm);
                    }

                    // Find or create Salary record
                    Salary salary = salaryMap.get(finalEmp.getId());
                    if (salary == null) {
                        salary = Salary.builder()
                            .employee(finalEmp)
                            .wageMonth(month)
                            .wageYear(year)
                            .build();
                        salaryMap.put(finalEmp.getId(), salary);
                    }

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
                    salariesToSave.add(salary);

                    // Create or update Payslip snapshot (avoid duplicates per employee+month+year)
                    Payslip payslip = payslipMap.get(finalEmp.getId());
                    if (payslip == null) {
                        payslip = Payslip.builder()
                            .employee(finalEmp)
                            .wageMonth(month)
                            .wageYear(year)
                            .build();
                        payslipMap.put(finalEmp.getId(), payslip);
                    }
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
                    payslipsToSave.add(payslip);

                    successCount++;
                } catch (Exception e) {
                    log.error("Error processing row {}: {}", i + 1, e.getMessage());
                    failureCount++;
                    errors.add(Map.of("row", String.valueOf(i + 1), "message", e.getMessage() != null ? e.getMessage() : "Unknown error"));
                }
            }

            // Fast batch persistence
            if (!mastersToSave.isEmpty()) {
                salaryMasterRepository.saveAll(mastersToSave.values());
            }
            if (!salariesToSave.isEmpty()) {
                salaryRepository.saveAll(salariesToSave);
            }
            if (!payslipsToSave.isEmpty()) {
                payslipRepository.saveAll(payslipsToSave);
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
        CellType type = cell.getCellType();
        if (type == CellType.FORMULA) {
            type = cell.getCachedFormulaResultType();
        }
        return switch (type) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    LocalDate ld = cell.getLocalDateTimeCellValue().toLocalDate();
                    yield ld.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                }
                double val = cell.getNumericCellValue();
                yield (val == Math.floor(val) && !Double.isInfinite(val))
                    ? String.valueOf((long) val)
                    : String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private String normalizeCode(String code) {
        if (code == null) return "";
        String clean = code.replaceAll("[^a-zA-Z0-9]", "");
        String digits = clean.replaceAll("[^0-9]", "");
        String alpha = clean.replaceAll("[0-9]", "");
        if (digits.isEmpty()) return clean.toUpperCase();
        return alpha.toUpperCase() + String.format("%04d", Integer.parseInt(digits));
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
