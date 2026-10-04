package com.ems.service;

import com.ems.dto.SalaryMasterDTO;
import com.ems.exception.BadRequestException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.*;
import com.ems.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SalaryMasterService {

    private final SalaryMasterRepository salaryMasterRepository;
    private final SalaryMasterHistoryRepository historyRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryMasterSnapshotRepository snapshotRepository;
    private final SalaryRepository salaryRepository;

    @Transactional(readOnly = true)
    public List<SalaryMasterDTO> getAll() {
        return salaryMasterRepository.findAllByOrderByEmployeeAsc().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SalaryMasterDTO getByEmployeeId(Long employeeId) {
        SalaryMaster master = salaryMasterRepository.findByEmployeeId(employeeId)
            .orElseThrow(() -> new ResourceNotFoundException("Salary master not found for employee " + employeeId));
        return toDTO(master);
    }

    @Transactional
    public SalaryMasterDTO saveOrUpdate(SalaryMasterDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + dto.getEmployeeId()));

        String currentUser = getCurrentUser();

        SalaryMaster master = salaryMasterRepository.findByEmployeeId(dto.getEmployeeId())
            .orElseGet(() -> SalaryMaster.builder()
                .employee(employee)
                .build());

        trackChanges(master, dto, currentUser);

        master.setBasic(safe(dto.getBasic()));
        master.setHra(safe(dto.getHra()));
        master.setFixedPersonalAllowance(safe(dto.getFixedPersonalAllowance()));
        master.setOtherAllowance(safe(dto.getOtherAllowance()));
        master.setBonus(safe(dto.getBonus()));
        master.setAppraisalAmount(safe(dto.getAppraisalAmount()));
        master.setLateSittingAmount(safe(dto.getLateSittingAmount()));
        master.setPfDeduction(safe(dto.getPfDeduction()));
        master.setEsiDeduction(safe(dto.getEsiDeduction()));
        master.setPtDeduction(safe(dto.getPtDeduction()));
        master.setHealthInsurance(safe(dto.getHealthInsurance()));
        master.setOvertimeWages(safe(dto.getOvertimeWages()));
        if (dto.getWorkingHoursPerDay() != null) master.setWorkingHoursPerDay(dto.getWorkingHoursPerDay());
        if (dto.getWeeklyOff() != null) master.setWeeklyOff(dto.getWeeklyOff());
        if (dto.getWorkerType() != null) master.setWorkerType(dto.getWorkerType());
        if (dto.getEffectiveFrom() != null) master.setEffectiveFrom(dto.getEffectiveFrom());

        master = salaryMasterRepository.save(master);

        takeSnapshot(master, currentUser);
        log.info("Salary master saved for employee {}", employee.getEmployeeCode());
        return toDTO(master);
    }

    @Transactional
    public List<SalaryMasterDTO> initForAll() {
        List<Employee> employees = employeeRepository.findAllLiveEmployees();
        List<SalaryMasterDTO> results = new ArrayList<>();
        for (Employee emp : employees) {
            if (!salaryMasterRepository.existsByEmployeeId(emp.getId())) {
                results.add(initForEmployee(emp.getId()));
            }
        }
        return getAll();
    }

    @Transactional
    public SalaryMasterDTO initForEmployee(Long employeeId) {
        if (salaryMasterRepository.existsByEmployeeId(employeeId)) {
            return getByEmployeeId(employeeId);
        }
        SalaryMasterDTO dto = SalaryMasterDTO.builder()
            .employeeId(employeeId)
            .basic(BigDecimal.ZERO)
            .hra(BigDecimal.ZERO)
            .fixedPersonalAllowance(BigDecimal.ZERO)
            .otherAllowance(BigDecimal.ZERO)
            .bonus(BigDecimal.ZERO)
            .appraisalAmount(BigDecimal.ZERO)
            .lateSittingAmount(BigDecimal.ZERO)
            .pfDeduction(BigDecimal.ZERO)
            .esiDeduction(BigDecimal.ZERO)
            .ptDeduction(BigDecimal.ZERO)
            .healthInsurance(BigDecimal.ZERO)
            .overtimeWages(BigDecimal.ZERO)
            .workingHoursPerDay(8)
            .weeklyOff("Allowed")
            .workerType("Permanent")
            .build();
        return saveOrUpdate(dto);
    }

    public List<SalaryMasterHistory> getHistory(Long employeeId) {
        return historyRepository.findByEmployeeIdOrderByChangedAtDesc(employeeId);
    }

    @Transactional(readOnly = true)
    public List<SalaryMasterSnapshot> getSnapshots(Long employeeId) {
        return snapshotRepository.findByEmployeeIdOrderBySnapshotYearDescSnapshotMonthDesc(employeeId);
    }

    @Transactional
    public void deleteById(Long id) {
        SalaryMaster master = salaryMasterRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Salary master not found: " + id));
        Long empId = master.getEmployee().getId();
        historyRepository.deleteAll(historyRepository.findByEmployeeIdOrderByChangedAtDesc(empId));
        snapshotRepository.deleteAll(snapshotRepository.findByEmployeeIdOrderBySnapshotYearDescSnapshotMonthDesc(empId));
        salaryMasterRepository.delete(master);
        log.info("Deleted salary master id {} for employee {}", id, master.getEmployee().getEmployeeCode());
    }

    @Transactional
    public void deleteByEmployeeId(Long employeeId) {
        SalaryMaster master = salaryMasterRepository.findByEmployeeId(employeeId)
            .orElseThrow(() -> new ResourceNotFoundException("Salary master not found for employee " + employeeId));
        historyRepository.deleteAll(historyRepository.findByEmployeeIdOrderByChangedAtDesc(employeeId));
        snapshotRepository.deleteAll(snapshotRepository.findByEmployeeIdOrderBySnapshotYearDescSnapshotMonthDesc(employeeId));
        salaryMasterRepository.delete(master);
        log.info("Deleted salary master for employee id {}", employeeId);
    }

    @Transactional
    public void deleteAll() {
        historyRepository.deleteAll();
        snapshotRepository.deleteAll();
        salaryMasterRepository.deleteAll();
        log.info("Deleted all salary master records, history, and snapshots");
    }

    // =========================================================================
    // EXCEL EXPORT & TEMPLATE
    // =========================================================================

    @Transactional(readOnly = true)
    public byte[] exportSalaryMastersToExcel() {
        List<SalaryMaster> masters = salaryMasterRepository.findAllByOrderByEmployeeAsc();

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Salary Master");
            CellStyle titleStyle = createTitleStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dataStyle = createDataStyle(wb);
            CellStyle currencyStyle = createCurrencyStyle(wb);
            CellStyle totalStyle = createTotalStyle(wb);

            int r = 0;
            Row titleRow = sheet.createRow(r++);
            createCell(titleRow, 0, "PARIKAR PBKS - Employee Salary Master Directory", titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 17));
            r++;

            String[] headers = {
                "S.No", "Employee Code", "Employee Name", "Designation", "Department",
                "Basic", "HRA", "Fixed Personal Allowance", "Other Allowance", "Gross Salary",
                "PF Deduction", "ESI Deduction", "PT Deduction", "Health Insurance", "Total Deductions",
                "Net Pay", "Annual CTC", "Worker Type"
            };

            Row hRow = sheet.createRow(r++);
            for (int i = 0; i < headers.length; i++) {
                createCell(hRow, i, headers[i], headerStyle);
            }

            int sl = 1;
            BigDecimal sumGross = BigDecimal.ZERO;
            BigDecimal sumDed = BigDecimal.ZERO;
            BigDecimal sumNet = BigDecimal.ZERO;
            BigDecimal sumCtc = BigDecimal.ZERO;

            for (SalaryMaster m : masters) {
                Employee e = m.getEmployee();
                Row row = sheet.createRow(r++);
                int c = 0;
                createCell(row, c++, sl++, dataStyle);
                createCell(row, c++, safeStr(e.getEmployeeCode()), dataStyle);
                createCell(row, c++, safeStr(e.getFullName()), dataStyle);
                createCell(row, c++, safeStr(e.getDesignation()), dataStyle);
                createCell(row, c++, safeStr(e.getDepartment() != null ? e.getDepartment() : e.getProcessAssigned()), dataStyle);

                createCell(row, c++, m.getBasic(), currencyStyle);
                createCell(row, c++, m.getHra(), currencyStyle);
                createCell(row, c++, m.getFixedPersonalAllowance(), currencyStyle);
                createCell(row, c++, m.getOtherAllowance(), currencyStyle);
                createCell(row, c++, m.getGrossSalary(), currencyStyle);

                createCell(row, c++, m.getPfDeduction(), currencyStyle);
                createCell(row, c++, m.getEsiDeduction(), currencyStyle);
                createCell(row, c++, m.getPtDeduction(), currencyStyle);
                createCell(row, c++, m.getHealthInsurance(), currencyStyle);
                createCell(row, c++, m.getTotalDeductions(), currencyStyle);

                createCell(row, c++, m.getNetPay(), currencyStyle);
                createCell(row, c++, m.getAnnualCtc(), currencyStyle);
                createCell(row, c++, safeStr(m.getWorkerType()), dataStyle);

                sumGross = sumGross.add(m.getGrossSalary());
                sumDed = sumDed.add(m.getTotalDeductions());
                sumNet = sumNet.add(m.getNetPay());
                sumCtc = sumCtc.add(m.getAnnualCtc());
            }

            // Total row
            Row tRow = sheet.createRow(r++);
            createCell(tRow, 0, "Total", totalStyle);
            for (int i = 1; i < 5; i++) createCell(tRow, i, "", totalStyle);
            createCell(tRow, 9, sumGross, totalStyle);
            createCell(tRow, 14, sumDed, totalStyle);
            createCell(tRow, 15, sumNet, totalStyle);
            createCell(tRow, 16, sumCtc, totalStyle);

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error exporting Salary Masters", e);
            throw new RuntimeException("Failed to export Salary Masters", e);
        }
    }

    @Transactional(readOnly = true)
    public byte[] generateSampleExcelTemplate() {
        List<Employee> employees = employeeRepository.findAllLiveEmployees();

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Salary_Master_Import_Template");
            CellStyle titleStyle = createTitleStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dataStyle = createDataStyle(wb);
            CellStyle currencyStyle = createCurrencyStyle(wb);

            int r = 0;
            Row titleRow = sheet.createRow(r++);
            createCell(titleRow, 0, "INSTRUCTIONS: Update salary components for live employees and upload back. Columns marked with * are required.", titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 18));

            Row hRow = sheet.createRow(r++);
            String[] headers = {
                "Employee Code*", "Employee Name (Ref)", "Designation (Ref)", "Department (Ref)",
                "Basic*", "HRA", "Fixed Personal Allowance", "Other Allowance",
                "Bonus", "Appraisal Amount", "Late Sitting Amount",
                "PF Deduction", "ESI Deduction", "PT Deduction", "Health Insurance",
                "Overtime Wages", "Working Hours", "Weekly Off", "Worker Type"
            };

            for (int i = 0; i < headers.length; i++) {
                createCell(hRow, i, headers[i], headerStyle);
            }

            // Pre-populate template with exactly 1 live employee for testing and reference
            Employee sampleEmp = (employees != null && !employees.isEmpty()) ? employees.get(0) : null;
            String sampleCode = sampleEmp != null && sampleEmp.getEmployeeCode() != null ? sampleEmp.getEmployeeCode() : "PARI0001";
            String sampleName = sampleEmp != null ? safeStr(sampleEmp.getFullName()) : "Sample Employee";
            String sampleDesig = sampleEmp != null ? safeStr(sampleEmp.getDesignation()) : "Executive";
            String sampleDept = sampleEmp != null ? safeStr(sampleEmp.getDepartment() != null ? sampleEmp.getDepartment() : sampleEmp.getProcessAssigned()) : "Operations";

            SalaryMaster existingSm = (sampleEmp != null) ? salaryMasterRepository.findByEmployeeId(sampleEmp.getId()).orElse(null) : null;

            BigDecimal basic = (existingSm != null && existingSm.getBasic() != null && existingSm.getBasic().compareTo(BigDecimal.ZERO) > 0)
                ? existingSm.getBasic() : new BigDecimal("15000.00");
            BigDecimal hra = (existingSm != null && existingSm.getHra() != null && existingSm.getHra().compareTo(BigDecimal.ZERO) > 0)
                ? existingSm.getHra() : new BigDecimal("6000.00");
            BigDecimal fpa = (existingSm != null && existingSm.getFixedPersonalAllowance() != null && existingSm.getFixedPersonalAllowance().compareTo(BigDecimal.ZERO) > 0)
                ? existingSm.getFixedPersonalAllowance() : new BigDecimal("3000.00");
            BigDecimal other = (existingSm != null && existingSm.getOtherAllowance() != null && existingSm.getOtherAllowance().compareTo(BigDecimal.ZERO) > 0)
                ? existingSm.getOtherAllowance() : new BigDecimal("1000.00");
            BigDecimal bonus = (existingSm != null && existingSm.getBonus() != null) ? existingSm.getBonus() : BigDecimal.ZERO;
            BigDecimal appraisal = (existingSm != null && existingSm.getAppraisalAmount() != null) ? existingSm.getAppraisalAmount() : BigDecimal.ZERO;
            BigDecimal lateSitting = (existingSm != null && existingSm.getLateSittingAmount() != null) ? existingSm.getLateSittingAmount() : BigDecimal.ZERO;
            BigDecimal pf = (existingSm != null && existingSm.getPfDeduction() != null && existingSm.getPfDeduction().compareTo(BigDecimal.ZERO) > 0)
                ? existingSm.getPfDeduction() : new BigDecimal("1800.00");
            BigDecimal esi = (existingSm != null && existingSm.getEsiDeduction() != null && existingSm.getEsiDeduction().compareTo(BigDecimal.ZERO) > 0)
                ? existingSm.getEsiDeduction() : new BigDecimal("187.50");
            BigDecimal pt = (existingSm != null && existingSm.getPtDeduction() != null && existingSm.getPtDeduction().compareTo(BigDecimal.ZERO) > 0)
                ? existingSm.getPtDeduction() : new BigDecimal("200.00");
            BigDecimal health = (existingSm != null && existingSm.getHealthInsurance() != null && existingSm.getHealthInsurance().compareTo(BigDecimal.ZERO) > 0)
                ? existingSm.getHealthInsurance() : new BigDecimal("500.00");
            BigDecimal ot = (existingSm != null && existingSm.getOvertimeWages() != null) ? existingSm.getOvertimeWages() : BigDecimal.ZERO;
            int wh = (existingSm != null && existingSm.getWorkingHoursPerDay() != null) ? existingSm.getWorkingHoursPerDay() : 8;
            String wo = (existingSm != null && existingSm.getWeeklyOff() != null) ? existingSm.getWeeklyOff() : "Allowed";
            String wt = (existingSm != null && existingSm.getWorkerType() != null) ? existingSm.getWorkerType() : "Permanent";

            Row row = sheet.createRow(r++);
            int c = 0;
            createCell(row, c++, sampleCode, dataStyle);
            createCell(row, c++, sampleName, dataStyle);
            createCell(row, c++, sampleDesig, dataStyle);
            createCell(row, c++, sampleDept, dataStyle);

            createCell(row, c++, basic, currencyStyle);
            createCell(row, c++, hra, currencyStyle);
            createCell(row, c++, fpa, currencyStyle);
            createCell(row, c++, other, currencyStyle);
            createCell(row, c++, bonus, currencyStyle);
            createCell(row, c++, appraisal, currencyStyle);
            createCell(row, c++, lateSitting, currencyStyle);
            createCell(row, c++, pf, currencyStyle);
            createCell(row, c++, esi, currencyStyle);
            createCell(row, c++, pt, currencyStyle);
            createCell(row, c++, health, currencyStyle);
            createCell(row, c++, ot, currencyStyle);
            createCell(row, c++, wh, dataStyle);
            createCell(row, c++, wo, dataStyle);
            createCell(row, c++, wt, dataStyle);

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error generating Salary Master Template", e);
            throw new RuntimeException("Failed to generate template", e);
        }
    }

    @Transactional
    public Map<String, Object> importSalaryMastersFromExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select an Excel file to upload");
        }

        int importedCount = 0;
        int updatedCount = 0;
        int skippedCount = 0;
        List<String> errors = new ArrayList<>();
        String currentUser = getCurrentUser();

        try (InputStream is = file.getInputStream(); Workbook wb = WorkbookFactory.create(is)) {
            FormulaEvaluator evaluator = wb.getCreationHelper().createFormulaEvaluator();
            Sheet sheet = wb.getSheetAt(0);
            int totalRows = sheet.getLastRowNum();
            if (totalRows < 0) {
                throw new BadRequestException("The uploaded Excel file is empty.");
            }

            int headerRowIdx = -1;
            Map<String, Integer> colMap = new HashMap<>();
            String empCodeKey = null;

            // Search first 20 rows for the header row
            for (int r = 0; r <= Math.min(20, totalRows); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                Map<String, Integer> tempMap = new HashMap<>();
                String foundEmpKey = null;

                for (Cell cell : row) {
                    String raw = getCellString(cell, evaluator).trim().toLowerCase();
                    String clean = raw.replaceAll("[^a-z0-9]", "");
                    if (clean.isEmpty()) continue;

                    tempMap.put(clean, cell.getColumnIndex());

                    if (foundEmpKey == null && (
                        clean.equals("employeecode") || clean.equals("empcode") || clean.equals("ecode") ||
                        clean.equals("employeeno") || clean.equals("empno") || clean.equals("employeenumber") ||
                        clean.equals("empid") || clean.equals("employeeid") || clean.equals("staffcode") ||
                        clean.equals("staffid") || clean.equals("paricode") || clean.equals("staffno") ||
                        clean.equals("code") || (raw.contains("emp") && raw.contains("code")) ||
                        (raw.contains("staff") && raw.contains("code")) || (raw.contains("employee") && raw.contains("code"))
                    )) {
                        foundEmpKey = clean;
                    }
                }

                if (foundEmpKey != null) {
                    headerRowIdx = r;
                    colMap = tempMap;
                    empCodeKey = foundEmpKey;
                    break;
                }
            }

            // Fallback: If no explicit header matched, scan rows for first column containing PARI... or alphanumeric code pattern
            if (headerRowIdx == -1 || empCodeKey == null) {
                for (int r = 0; r <= Math.min(20, totalRows); r++) {
                    Row row = sheet.getRow(r);
                    if (row == null) continue;
                    for (Cell cell : row) {
                        String raw = getCellString(cell, evaluator).trim().toUpperCase();
                        if (raw.startsWith("PARI") || (raw.length() >= 3 && raw.matches("^[A-Z0-9_-]+$") && employeeRepository.findByEmployeeCodeIgnoreCase(raw).isPresent())) {
                            headerRowIdx = Math.max(0, r - 1);
                            Row hRow = sheet.getRow(headerRowIdx);
                            if (hRow != null) {
                                for (Cell hc : hRow) {
                                    String clean = getCellString(hc, evaluator).trim().toLowerCase().replaceAll("[^a-z0-9]", "");
                                    if (!clean.isEmpty()) colMap.put(clean, hc.getColumnIndex());
                                }
                            }
                            empCodeKey = "auto_emp_code";
                            colMap.put(empCodeKey, cell.getColumnIndex());
                            break;
                        }
                    }
                    if (empCodeKey != null) break;
                }
            }

            if (headerRowIdx == -1 || empCodeKey == null || !colMap.containsKey(empCodeKey)) {
                throw new BadRequestException("Could not find 'Employee Code' or 'Emp Code' column in the uploaded Excel file. Please ensure the column header is present.");
            }

            int empColIdx = colMap.get(empCodeKey);
            log.info("Starting Salary Master Excel import: headerRowIdx={}, colMap={}", headerRowIdx, colMap);

            for (int r = headerRowIdx + 1; r <= totalRows; r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                String empCode = getCellString(row.getCell(empColIdx), evaluator).trim();
                String empName = getFirstMatchingString(row, colMap, evaluator, "employeename", "empname", "name", "fullname", "staffname");
                if (empName == null) empName = "";
                empName = empName.trim();

                String cleanEmpCode = empCode.replaceAll("[^a-zA-Z0-9_-]", "");
                if (cleanEmpCode.isEmpty()) continue;

                String lowerCode = empCode.toLowerCase();
                // Skip summary/total/header-repeat rows
                if (lowerCode.equals("total") || lowerCode.startsWith("total") || lowerCode.contains("subtotal") ||
                    lowerCode.contains("grand total") || lowerCode.contains("employee code") || lowerCode.contains("emp code") ||
                    lowerCode.contains("instructions") || lowerCode.contains("columns marked") || lowerCode.equals("s.no") ||
                    lowerCode.equals("sl.no") || lowerCode.equals("sno") || lowerCode.equals("slno")) {
                    continue;
                }

                // Match employee by code (case-insensitive & variations)
                Optional<Employee> empOpt = employeeRepository.findByEmployeeCodeIgnoreCase(cleanEmpCode);
                if (empOpt.isEmpty() && !cleanEmpCode.equalsIgnoreCase(empCode)) {
                    empOpt = employeeRepository.findByEmployeeCodeIgnoreCase(empCode);
                }
                if (empOpt.isEmpty() && cleanEmpCode.matches("^[0-9]+$")) {
                    int num = Integer.parseInt(cleanEmpCode);
                    empOpt = employeeRepository.findByEmployeeCodeIgnoreCase(String.format("PARI%04d", num));
                    if (empOpt.isEmpty()) {
                        empOpt = employeeRepository.findByEmployeeCodeIgnoreCase(String.format("PARI%03d", num));
                    }
                    if (empOpt.isEmpty()) {
                        empOpt = employeeRepository.findByEmployeeCodeIgnoreCase(String.format("PARI%02d", num));
                    }
                }
                if (empOpt.isEmpty() && cleanEmpCode.toUpperCase().startsWith("PARI")) {
                    String numPart = cleanEmpCode.substring(4).replaceAll("[^0-9]", "");
                    if (!numPart.isEmpty()) {
                        int num = Integer.parseInt(numPart);
                        empOpt = employeeRepository.findByEmployeeCodeIgnoreCase(String.format("PARI%04d", num));
                        if (empOpt.isEmpty()) {
                            empOpt = employeeRepository.findByEmployeeCodeIgnoreCase(String.format("PARI%03d", num));
                        }
                    }
                }

                // Fallback: match by employee name if employee code was not found
                if (empOpt.isEmpty() && !empName.isEmpty() && !empName.equalsIgnoreCase("sample employee")) {
                    List<Employee> liveEmps = employeeRepository.findAllLiveEmployees();
                    String searchNameClean = empName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
                    for (Employee le : liveEmps) {
                        String leNameClean = safeStr(le.getFullName()).replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
                        String leFirstLastClean = (safeStr(le.getFirstName()) + safeStr(le.getSurname())).replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
                        String leLastFirstClean = (safeStr(le.getSurname()) + safeStr(le.getFirstName())).replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
                        if (leNameClean.equals(searchNameClean) || leFirstLastClean.equals(searchNameClean) || leLastFirstClean.equals(searchNameClean)) {
                            empOpt = Optional.of(le);
                            break;
                        }
                    }
                }

                // If still not found
                if (empOpt.isEmpty()) {
                    // Silently ignore dummy template placeholder rows
                    if (lowerCode.contains("sample") || empName.toLowerCase().contains("sample") ||
                        (cleanEmpCode.equalsIgnoreCase("PARI0001") && (empName.isEmpty() || empName.toLowerCase().contains("sample")))) {
                        continue;
                    }

                    skippedCount++;
                    if (errors.size() < 20) {
                        String desc = "Row " + (r + 1) + ": Employee code '" + empCode + "'";
                        if (!empName.isEmpty()) desc += " (" + empName + ")";
                        desc += " was not found in active staff";
                        errors.add(desc);
                    }
                    continue;
                }

                Employee emp = empOpt.get();
                boolean isNew = !salaryMasterRepository.existsByEmployeeId(emp.getId());
                SalaryMaster master = salaryMasterRepository.findByEmployeeId(emp.getId())
                    .orElseGet(() -> SalaryMaster.builder().employee(emp).build());

                BigDecimal basic = getCellDecimal(row, colMap, evaluator, "basic", "basicpay", "basicsalary", "basicwages");
                BigDecimal hra = getCellDecimal(row, colMap, evaluator, "hra", "houserentallowance", "houserent");
                BigDecimal fpa = getCellDecimal(row, colMap, evaluator, "fixedpersonalallowance", "fpa", "personalallowance", "fixedallowance");
                BigDecimal other = getCellDecimal(row, colMap, evaluator, "otherallowance", "othallowance", "other", "specialallowance", "splallowance", "allowance");
                BigDecimal bonus = getCellDecimal(row, colMap, evaluator, "bonus", "bonusamount", "annualbonus", "incentive");
                BigDecimal appraisal = getCellDecimal(row, colMap, evaluator, "appraisalamount", "appraisal", "increment");
                BigDecimal lateSitting = getCellDecimal(row, colMap, evaluator, "latesittingamount", "latesitting", "late");
                BigDecimal pf = getCellDecimal(row, colMap, evaluator, "pfdeduction", "pf", "providentfund", "epf");
                BigDecimal esi = getCellDecimal(row, colMap, evaluator, "esideduction", "esi", "esic");
                BigDecimal pt = getCellDecimal(row, colMap, evaluator, "ptdeduction", "pt", "professionaltax", "proftax");
                BigDecimal health = getCellDecimal(row, colMap, evaluator, "healthinsurance", "health", "insurance", "mediclaim", "medicalinsurance");
                BigDecimal ot = getCellDecimal(row, colMap, evaluator, "overtimewages", "ot", "overtime", "otwages");

                master.setBasic(basic);
                master.setHra(hra);
                master.setFixedPersonalAllowance(fpa);
                master.setOtherAllowance(other);
                master.setBonus(bonus);
                master.setAppraisalAmount(appraisal);
                master.setLateSittingAmount(lateSitting);
                master.setPfDeduction(pf);
                master.setEsiDeduction(esi);
                master.setPtDeduction(pt);
                master.setHealthInsurance(health);
                master.setOvertimeWages(ot);

                String wh = getFirstMatchingString(row, colMap, evaluator, "workinghours", "workinghoursperday", "workhours", "hours");
                if (wh != null && !wh.isEmpty()) {
                    try { master.setWorkingHoursPerDay((int) Double.parseDouble(wh)); } catch (Exception ignored) {}
                }

                String wo = getFirstMatchingString(row, colMap, evaluator, "weeklyoff", "weekoff", "offday");
                if (wo != null && !wo.isEmpty()) master.setWeeklyOff(wo);

                String wt = getFirstMatchingString(row, colMap, evaluator, "workertype", "employmenttype", "worker", "type", "stafftype");
                if (wt != null && !wt.isEmpty()) master.setWorkerType(wt);

                master.setUpdatedBy(currentUser);
                salaryMasterRepository.save(master);
                takeSnapshot(master, currentUser);

                log.info("Saved Salary Master row {}: Emp={}, Basic={}, Gross={}, Net={}", r + 1, emp.getEmployeeCode(), basic, master.getGrossSalary(), master.getNetPay());

                if (isNew) importedCount++;
                else updatedCount++;
            }

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to process Excel import", e);
            throw new BadRequestException("Error processing Excel: " + e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("importedCount", importedCount);
        result.put("updatedCount", updatedCount);
        result.put("totalProcessed", importedCount + updatedCount);
        result.put("skippedCount", skippedCount);
        result.put("errors", errors);
        return result;
    }

    // =========================================================================
    // SAMPLE DATA GENERATION
    // =========================================================================

    @Transactional
    public Map<String, Object> seedSampleSalaries() {
        List<Employee> employees = employeeRepository.findAllLiveEmployees();
        int count = 0;
        String currentUser = getCurrentUser();

        for (Employee emp : employees) {
            SalaryMaster master = salaryMasterRepository.findByEmployeeId(emp.getId())
                .orElseGet(() -> SalaryMaster.builder().employee(emp).build());

            String desig = emp.getDesignation() != null ? emp.getDesignation().toLowerCase() : "";
            BigDecimal base;
            if (desig.contains("manager") || desig.contains("lead") || desig.contains("head")) {
                base = new BigDecimal("35000.00");
            } else if (desig.contains("senior") || desig.contains("sr")) {
                base = new BigDecimal("25000.00");
            } else if (desig.contains("junior") || desig.contains("trainee") || desig.contains("intern")) {
                base = new BigDecimal("12000.00");
            } else {
                base = new BigDecimal("18000.00");
            }

            BigDecimal hra = base.multiply(new BigDecimal("0.40")).setScale(2, java.math.RoundingMode.HALF_UP);
            BigDecimal fpa = base.multiply(new BigDecimal("0.20")).setScale(2, java.math.RoundingMode.HALF_UP);
            BigDecimal other = new BigDecimal("1500.00");

            BigDecimal pf = base.multiply(new BigDecimal("0.12")).setScale(2, java.math.RoundingMode.HALF_UP);
            if (pf.compareTo(new BigDecimal("1800.00")) > 0) pf = new BigDecimal("1800.00");

            BigDecimal gross = base.add(hra).add(fpa).add(other);
            BigDecimal esi = gross.compareTo(new BigDecimal("21000.00")) <= 0 
                ? gross.multiply(new BigDecimal("0.0075")).setScale(2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

            BigDecimal pt = new BigDecimal("200.00");
            BigDecimal health = new BigDecimal("500.00");

            master.setBasic(base);
            master.setHra(hra);
            master.setFixedPersonalAllowance(fpa);
            master.setOtherAllowance(other);
            master.setBonus(BigDecimal.ZERO);
            master.setAppraisalAmount(BigDecimal.ZERO);
            master.setLateSittingAmount(BigDecimal.ZERO);
            master.setPfDeduction(pf);
            master.setEsiDeduction(esi);
            master.setPtDeduction(pt);
            master.setHealthInsurance(health);
            master.setOvertimeWages(BigDecimal.ZERO);
            master.setWorkingHoursPerDay(8);
            master.setWeeklyOff("Allowed");
            master.setWorkerType("Permanent");
            master.setUpdatedBy(currentUser);

            salaryMasterRepository.save(master);
            takeSnapshot(master, currentUser);
            count++;
        }

        // Sync for current year months (July 2026, August 2026, etc.)
        syncToMonthlySalaries(2026, 7);
        syncToMonthlySalaries(2026, 8);
        syncToMonthlySalaries(LocalDate.now().getYear(), LocalDate.now().getMonthValue());

        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Sample salary masters created and synced for " + count + " employees");
        resp.put("seededCount", count);
        return resp;
    }

    @Transactional
    public Map<String, Object> syncToMonthlySalaries(Integer year, Integer month) {
        List<SalaryMaster> masters = salaryMasterRepository.findAll();
        int created = 0;
        int updated = 0;

        for (SalaryMaster m : masters) {
            Employee emp = m.getEmployee();
            Optional<Salary> salOpt = salaryRepository.findByEmployeeIdAndWageYearAndWageMonth(emp.getId(), year, month);
            Salary s = salOpt.orElseGet(() -> Salary.builder()
                .employee(emp)
                .wageYear(year)
                .wageMonth(month)
                .build());

            s.setBasic(m.getBasic());
            s.setHra(m.getHra());
            s.setFixedPersonalAllowance(m.getFixedPersonalAllowance());
            s.setOtherAllowance(m.getOtherAllowance());
            s.setBonus(m.getBonus());
            s.setAppraisalAmount(m.getAppraisalAmount());
            s.setLateSittingAmount(m.getLateSittingAmount());
            s.setPfDeduction(m.getPfDeduction());
            s.setEsiDeduction(m.getEsiDeduction());
            s.setPtDeduction(m.getPtDeduction());
            s.setHealthInsurance(m.getHealthInsurance());
            s.setOvertimeWages(m.getOvertimeWages());
            s.setWorkingHoursPerDay(m.getWorkingHoursPerDay());
            s.setWeeklyOff(m.getWeeklyOff());
            s.setWorkerType(m.getWorkerType());
            s.setDateOfPayment(LocalDate.of(year, month, Math.min(28, java.time.YearMonth.of(year, month).lengthOfMonth())).atStartOfDay());

            s.computeDerivedFields();
            salaryRepository.save(s);

            if (salOpt.isPresent()) updated++;
            else created++;
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("year", year);
        resp.put("month", month);
        resp.put("created", created);
        resp.put("updated", updated);
        resp.put("totalSynced", created + updated);
        return resp;
    }

    // =========================================================================
    // HELPERS & STYLES
    // =========================================================================

    private void takeSnapshot(SalaryMaster master, String user) {
        LocalDate now = LocalDate.now();
        SalaryMasterSnapshot snapshot = SalaryMasterSnapshot.builder()
            .employeeId(master.getEmployee().getId())
            .employeeCode(master.getEmployee().getEmployeeCode())
            .snapshotYear(now.getYear())
            .snapshotMonth(now.getMonthValue())
            .basic(master.getBasic())
            .hra(master.getHra())
            .fixedPersonalAllowance(master.getFixedPersonalAllowance())
            .otherAllowance(master.getOtherAllowance())
            .bonus(master.getBonus())
            .appraisalAmount(master.getAppraisalAmount())
            .lateSittingAmount(master.getLateSittingAmount())
            .pfDeduction(master.getPfDeduction())
            .esiDeduction(master.getEsiDeduction())
            .ptDeduction(master.getPtDeduction())
            .healthInsurance(master.getHealthInsurance())
            .overtimeWages(master.getOvertimeWages())
            .workingHoursPerDay(master.getWorkingHoursPerDay())
            .workerType(master.getWorkerType())
            .changedBy(user)
            .createdAt(LocalDateTime.now())
            .build();
        snapshotRepository.save(snapshot);
    }

    private void trackChanges(SalaryMaster master, SalaryMasterDTO dto, String user) {
        if (master.getId() == null) return;
        LocalDateTime now = LocalDateTime.now();
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(), "basic", master.getBasic(), dto.getBasic(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(), "hra", master.getHra(), dto.getHra(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(), "fixedPersonalAllowance", master.getFixedPersonalAllowance(), dto.getFixedPersonalAllowance(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(), "otherAllowance", master.getOtherAllowance(), dto.getOtherAllowance(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(), "pfDeduction", master.getPfDeduction(), dto.getPfDeduction(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(), "esiDeduction", master.getEsiDeduction(), dto.getEsiDeduction(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(), "ptDeduction", master.getPtDeduction(), dto.getPtDeduction(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(), "healthInsurance", master.getHealthInsurance(), dto.getHealthInsurance(), user, now);
    }

    private void trackField(Long masterId, Long empId, String empCode, String field, BigDecimal oldVal, BigDecimal newVal, String user, LocalDateTime now) {
        if (oldVal == null && newVal == null) return;
        if (oldVal != null && newVal != null && oldVal.compareTo(newVal) == 0) return;
        historyRepository.save(SalaryMasterHistory.builder()
            .salaryMasterId(masterId)
            .employeeId(empId)
            .employeeCode(empCode)
            .fieldName(field)
            .oldValue(oldVal != null ? oldVal.toPlainString() : null)
            .newValue(newVal != null ? newVal.toPlainString() : null)
            .changedBy(user)
            .changedAt(now)
            .build());
    }

    private SalaryMasterDTO toDTO(SalaryMaster master) {
        Employee e = master.getEmployee();
        return SalaryMasterDTO.builder()
            .id(master.getId())
            .employeeId(e.getId())
            .employeeCode(e.getEmployeeCode())
            .employeeName(e.getFullName())
            .designation(e.getDesignation())
            .department(e.getDepartment() != null ? e.getDepartment() : e.getProcessAssigned())
            .employeeStatus(e.getEmployeeStatus() != null ? e.getEmployeeStatus() : "LIVE")
            .basic(master.getBasic())
            .hra(master.getHra())
            .fixedPersonalAllowance(master.getFixedPersonalAllowance())
            .otherAllowance(master.getOtherAllowance())
            .grossSalary(master.getGrossSalary())
            .bonus(master.getBonus())
            .appraisalAmount(master.getAppraisalAmount())
            .lateSittingAmount(master.getLateSittingAmount())
            .pfDeduction(master.getPfDeduction())
            .esiDeduction(master.getEsiDeduction())
            .ptDeduction(master.getPtDeduction())
            .healthInsurance(master.getHealthInsurance())
            .totalDeductions(master.getTotalDeductions())
            .netPay(master.getNetPay())
            .annualCtc(master.getAnnualCtc())
            .overtimeWages(master.getOvertimeWages())
            .workingHoursPerDay(master.getWorkingHoursPerDay())
            .weeklyOff(master.getWeeklyOff())
            .workerType(master.getWorkerType())
            .effectiveFrom(master.getEffectiveFrom())
            .updatedAt(master.getUpdatedAt())
            .updatedBy(master.getUpdatedBy())
            .build();
    }

    private BigDecimal safe(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    private String safeStr(String val) {
        return val != null && !val.trim().isEmpty() ? val : "-";
    }

    private String getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    private Integer findColIndex(Map<String, Integer> colMap, String... keywords) {
        if (colMap == null || colMap.isEmpty() || keywords == null) return null;

        // 1. Exact match
        for (String kw : keywords) {
            String cleanKw = kw.toLowerCase().replaceAll("[^a-z0-9]", "");
            if (colMap.containsKey(cleanKw)) {
                return colMap.get(cleanKw);
            }
        }

        // 2. Prefix / Contains match
        for (String kw : keywords) {
            String cleanKw = kw.toLowerCase().replaceAll("[^a-z0-9]", "");
            if (cleanKw.length() < 3) continue;
            for (Map.Entry<String, Integer> entry : colMap.entrySet()) {
                String key = entry.getKey();
                if (key.startsWith(cleanKw) || key.contains(cleanKw) || cleanKw.contains(key)) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }

    private BigDecimal getCellDecimal(Row row, Map<String, Integer> colMap, FormulaEvaluator evaluator, String... keys) {
        Integer col = findColIndex(colMap, keys);
        if (col == null) return BigDecimal.ZERO;
        Cell cell = row.getCell(col);
        if (cell == null) return BigDecimal.ZERO;

        try {
            CellType type = cell.getCellType();
            if (type == CellType.FORMULA) {
                if (evaluator != null) {
                    try {
                        CellValue cv = evaluator.evaluate(cell);
                        if (cv != null) {
                            if (cv.getCellType() == CellType.NUMERIC) {
                                return BigDecimal.valueOf(cv.getNumberValue()).setScale(2, java.math.RoundingMode.HALF_UP);
                            } else if (cv.getCellType() == CellType.STRING) {
                                String clean = cv.getStringValue().replaceAll("[^0-9.]", "").trim();
                                if (!clean.isEmpty()) return new BigDecimal(clean).setScale(2, java.math.RoundingMode.HALF_UP);
                            }
                        }
                    } catch (Exception ignored) {}
                }
                type = cell.getCachedFormulaResultType();
            }

            if (type == CellType.NUMERIC) {
                return BigDecimal.valueOf(cell.getNumericCellValue()).setScale(2, java.math.RoundingMode.HALF_UP);
            } else if (type == CellType.STRING) {
                String clean = cell.getStringCellValue().replaceAll("[^0-9.]", "").trim();
                if (!clean.isEmpty()) return new BigDecimal(clean).setScale(2, java.math.RoundingMode.HALF_UP);
            } else if (type == CellType.BOOLEAN) {
                return cell.getBooleanCellValue() ? BigDecimal.ONE : BigDecimal.ZERO;
            }
        } catch (Exception ignored) {}

        // Fallback with DataFormatter
        try {
            DataFormatter df = new DataFormatter();
            String val = df.formatCellValue(cell, evaluator);
            if (val != null) {
                String clean = val.replaceAll("[^0-9.]", "").trim();
                if (!clean.isEmpty()) return new BigDecimal(clean).setScale(2, java.math.RoundingMode.HALF_UP);
            }
        } catch (Exception ignored) {}

        return BigDecimal.ZERO;
    }

    private String getFirstMatchingString(Row row, Map<String, Integer> colMap, FormulaEvaluator evaluator, String... keys) {
        Integer col = findColIndex(colMap, keys);
        if (col == null) return null;
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        String val = getCellString(cell, evaluator);
        return val != null && !val.trim().isEmpty() ? val.trim() : null;
    }

    private String getCellString(Cell cell, FormulaEvaluator evaluator) {
        if (cell == null) return "";
        try {
            DataFormatter df = new DataFormatter();
            return df.formatCellValue(cell, evaluator).trim();
        } catch (Exception e) {
            try {
                if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue().trim();
                if (cell.getCellType() == CellType.NUMERIC) {
                    if (DateUtil.isCellDateFormatted(cell)) return cell.getLocalDateTimeCellValue().toLocalDate().toString();
                    double d = cell.getNumericCellValue();
                    if (d == (long) d) return String.valueOf((long) d);
                    return String.valueOf(d);
                }
            } catch (Exception ignored) {}
        }
        return "";
    }

    private CellStyle createTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.LEFT);
        return style;
    }

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 9);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);
        return style;
    }

    private CellStyle createDataStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setFontHeightInPoints((short) 9);
        style.setFont(font);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createCurrencyStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setFontHeightInPoints((short) 9);
        style.setFont(font);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setDataFormat(wb.createDataFormat().getFormat("#,##0.00"));
        return style;
    }

    private CellStyle createTotalStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 9);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setDataFormat(wb.createDataFormat().getFormat("#,##0.00"));
        return style;
    }

    private void createCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    private void createCell(Row row, int col, int value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private void createCell(Row row, int col, BigDecimal value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value.doubleValue() : 0.0);
        cell.setCellStyle(style);
    }
}
