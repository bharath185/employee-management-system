package com.ems.service;

import com.ems.model.Company;
import com.ems.model.Employee;
import com.ems.model.Payslip;
import com.ems.model.Salary;
import com.ems.model.SalaryMaster;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.PayslipRepository;
import com.ems.repository.SalaryMasterRepository;
import com.ems.repository.SalaryRepository;
import com.ems.utils.BankFileExportHelper;
import com.ems.utils.PayrollReportExportHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PayrollExportService {

    private final PayslipRepository payslipRepository;
    private final SalaryRepository salaryRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryMasterRepository salaryMasterRepository;
    private final CompanyService companyService;
    private final BankFileExportHelper bankFileExportHelper;
    private final PayrollReportExportHelper payrollReportExportHelper;

    /**
     * Generate bank file Excel for a given payroll period.
     */
    public ResponseEntity<byte[]> exportBankFile(Integer year, Integer month) {
        List<Payslip> payslips = payslipRepository.findByWageYearAndWageMonthWithEmployee(year, month);

        String periodLabel = Month.of(month).name().charAt(0)
            + Month.of(month).name().substring(1).toLowerCase() + "_" + year;

        byte[] excelBytes = bankFileExportHelper.generateBankFile(payslips, periodLabel);

        String filename = "Bank_File_" + periodLabel + ".xlsx";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(excelBytes);
    }

    /**
     * Generate payroll report Excel for a given payroll period.
     */
    public ResponseEntity<byte[]> exportPayrollReport(Integer year, Integer month) {
        List<Payslip> payslips = payslipRepository.findByWageYearAndWageMonthWithEmployee(year, month);

        String periodLabel = Month.of(month).name().charAt(0)
            + Month.of(month).name().substring(1).toLowerCase() + "_" + year;

        byte[] excelBytes = payrollReportExportHelper.generatePayrollReport(payslips, periodLabel);

        String filename = "Payroll_Report_" + periodLabel + ".xlsx";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(excelBytes);
    }

    /**
     * Export Salary Statement in the same format as the import template.
     */
    public ResponseEntity<byte[]> exportSalaryStatement(Integer year, Integer month) {
        List<Salary> salaries = salaryRepository.findByWageYearAndWageMonthWithEmployee(year, month);

        String monthName = Month.of(month).name();
        monthName = monthName.charAt(0) + monthName.substring(1).toLowerCase();
        String periodLabel = monthName + " " + year;
        String filename = "Salary_Statement_" + periodLabel.replace(" ", "_") + ".xlsx";

        Company company = companyService.getCompany();
        String companyName = company != null ? safeStr(company.getCompanyName()) : "";
        String companyAddr = company != null ? safeStr(company.getAddress()) : "";
        String regNo = company != null ? safeStr(company.getGstNumber()) : "";

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Sheet1");

            Font boldFont = wb.createFont();
            boldFont.setBold(true);

            CellStyle boldStyle = wb.createCellStyle();
            boldStyle.setFont(boldFont);

            CellStyle headerStyle = wb.createCellStyle();
            headerStyle.setFont(boldFont);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            CellStyle dataStyle = wb.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            CellStyle numStyle = wb.createCellStyle();
            numStyle.setBorderBottom(BorderStyle.THIN);
            numStyle.setBorderTop(BorderStyle.THIN);
            numStyle.setBorderLeft(BorderStyle.THIN);
            numStyle.setBorderRight(BorderStyle.THIN);
            numStyle.setDataFormat(wb.createDataFormat().getFormat("#,##0.00"));
            numStyle.setAlignment(HorizontalAlignment.RIGHT);

            // Row 1: Company name
            Row r1 = sheet.createRow(0);
            setCell(r1, 0, "Name of the Establishment :", boldStyle);
            setCell(r1, 2, companyName, dataStyle);

            // Row 2: Address
            Row r2 = sheet.createRow(1);
            setCell(r2, 0, "Address :", boldStyle);
            setCell(r2, 2, companyAddr, dataStyle);

            // Row 3: empty

            // Row 4: Registration No
            Row r4 = sheet.createRow(3);
            setCell(r4, 0, "Registration No", boldStyle);
            setCell(r4, 1, regNo, dataStyle);

            // Row 5: empty

            // Row 6: Wages period
            Row r6 = sheet.createRow(5);
            setCell(r6, 0, "Wages period - " + periodLabel, boldStyle);

            // Row 7-8: Headers (matching template)
            Row r7 = sheet.createRow(6);
            String[] h7 = {"Sl.No", "Name of the Employee", "Employee Code", "Date of Appointment",
                "Rate of wages", "", "", "", "",
                "Normal wages earned", "", "", "", "",
                "No. of working day", "LOP", "Employee Effective Workdays",
                "Wages Earned for Overtime Work", "Gross Wages Payable",
                "Deductions", "", "", "",
                "Actual Wages Paid", "Date of Payment", "Signature or thumb impression of the employee", ""};
            for (int c = 0; c < h7.length; c++) {
                setCell(r7, c, h7[c], headerStyle);
            }

            Row r8 = sheet.createRow(7);
            String[] h8 = {"", "", "", "",
                "Basic", "HRA", "Fixed Personal Allow", "Oth. Allowance", "Gross Salary",
                "Basic", "HRA", "Fixed Personal Allow", "Oth. Allowance", "Gross Salary",
                "", "", "", "", "",
                "PF", "ESI", "PT", "HEALTH INSURANCE",
                "", "", ""};
            for (int c = 0; c < h8.length; c++) {
                setCell(r8, c, h8[c], headerStyle);
            }

            // Rows 9-11: empty

            // Data rows starting from row 12 (index 11)
            int rowIdx = 11;
            int slNo = 1;

            BigDecimal[] totals = new BigDecimal[27];
            for (int t = 0; t < 27; t++) totals[t] = BigDecimal.ZERO;

            for (Salary salary : salaries) {
                Employee emp = salary.getEmployee();
                Row row = sheet.createRow(rowIdx++);

                BigDecimal basic = safe(salary.getBasic());
                BigDecimal hra = safe(salary.getHra());
                BigDecimal fpa = safe(salary.getFixedPersonalAllowance());
                BigDecimal oa = safe(salary.getOtherAllowance());
                BigDecimal gross = safe(salary.getGrossSalary());
                BigDecimal pf = safe(salary.getPfDeduction());
                BigDecimal esi = safe(salary.getEsiDeduction());
                BigDecimal pt = safe(salary.getPtDeduction());
                BigDecimal hi = safe(salary.getHealthInsurance());
                BigDecimal ot = safe(salary.getOvertimeWages());
                BigDecimal net = safe(salary.getNetPay());

                BigDecimal rateGross = basic.add(hra).add(fpa).add(oa);
                BigDecimal normalGross = basic.add(hra).add(fpa).add(oa);

                setCell(row, 0, String.valueOf(slNo), dataStyle);
                setCell(row, 1, safeStr(emp.getFullName()), dataStyle);
                setCell(row, 2, safeStr(emp.getEmployeeCode()), dataStyle);
                setCell(row, 3, emp.getDoj() != null ? emp.getDoj().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "", dataStyle);
                setNumCell(row, 4, basic, numStyle);
                setNumCell(row, 5, hra, numStyle);
                setNumCell(row, 6, fpa, numStyle);
                setNumCell(row, 7, oa, numStyle);
                setNumCell(row, 8, rateGross, numStyle);
                setNumCell(row, 9, basic, numStyle);
                setNumCell(row, 10, hra, numStyle);
                setNumCell(row, 11, fpa, numStyle);
                setNumCell(row, 12, oa, numStyle);
                setNumCell(row, 13, normalGross, numStyle);

                // Working days / LOP / Effective from payslip or defaults
                Integer workingDays = 0;
                Integer lopDays = 0;
                Integer effDays = 0;
                // Try to get from payslip if exists
                try {
                    Payslip ps = payslipRepository.findByEmployeeIdAndWageYearAndWageMonth(emp.getId(), year, month).orElse(null);
                    if (ps != null) {
                        workingDays = ps.getTotalWorkingDays() != null ? ps.getTotalWorkingDays() : 0;
                        lopDays = ps.getLopDays() != null ? ps.getLopDays() : 0;
                        effDays = ps.getEffectiveWorkdays() != null ? ps.getEffectiveWorkdays() : 0;
                    }
                } catch (Exception ignored) {}

                setCell(row, 14, String.valueOf(workingDays), dataStyle);
                setCell(row, 15, String.valueOf(lopDays), dataStyle);
                setCell(row, 16, String.valueOf(effDays), dataStyle);
                setNumCell(row, 17, ot, numStyle);
                setNumCell(row, 18, gross, numStyle);
                setNumCell(row, 19, pf, numStyle);
                setNumCell(row, 20, esi, numStyle);
                setNumCell(row, 21, pt, numStyle);
                setNumCell(row, 22, hi, numStyle);
                setNumCell(row, 23, net, numStyle);
                setCell(row, 24, salary.getDateOfPayment() != null
                    ? salary.getDateOfPayment().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "", dataStyle);
                setCell(row, 25, "", dataStyle);
                setCell(row, 26, "", dataStyle);

                // Accumulate totals
                totals[4] = totals[4].add(basic);
                totals[5] = totals[5].add(hra);
                totals[6] = totals[6].add(fpa);
                totals[7] = totals[7].add(oa);
                totals[8] = totals[8].add(rateGross);
                totals[9] = totals[9].add(basic);
                totals[10] = totals[10].add(hra);
                totals[11] = totals[11].add(fpa);
                totals[12] = totals[12].add(oa);
                totals[13] = totals[13].add(normalGross);
                totals[17] = totals[17].add(ot);
                totals[18] = totals[18].add(gross);
                totals[19] = totals[19].add(pf);
                totals[20] = totals[20].add(esi);
                totals[21] = totals[21].add(pt);
                totals[22] = totals[22].add(hi);
                totals[23] = totals[23].add(net);

                slNo++;
            }

            // Grand Total row
            if (!salaries.isEmpty()) {
                Row gt = sheet.createRow(rowIdx + 1);
                CellStyle gtStyle = wb.createCellStyle();
                Font gtFont = wb.createFont();
                gtFont.setBold(true);
                gtStyle.setFont(gtFont);
                gtStyle.setBorderBottom(BorderStyle.THIN);
                gtStyle.setBorderTop(BorderStyle.THIN);
                gtStyle.setBorderLeft(BorderStyle.THIN);
                gtStyle.setBorderRight(BorderStyle.THIN);

                CellStyle gtNumStyle = wb.createCellStyle();
                gtNumStyle.setFont(gtFont);
                gtNumStyle.setBorderBottom(BorderStyle.THIN);
                gtNumStyle.setBorderTop(BorderStyle.THIN);
                gtNumStyle.setBorderLeft(BorderStyle.THIN);
                gtNumStyle.setBorderRight(BorderStyle.THIN);
                gtNumStyle.setDataFormat(wb.createDataFormat().getFormat("#,##0.00"));
                gtNumStyle.setAlignment(HorizontalAlignment.RIGHT);

                setCell(gt, 0, "Grand Total", gtStyle);
                for (int c = 4; c <= 23; c++) {
                    if (c == 14 || c == 15 || c == 16 || c == 24 || c == 25 || c == 26) continue;
                    setNumCell(gt, c, totals[c], gtNumStyle);
                }
            }

            // Auto-size columns (first few)
            for (int c = 0; c < 27; c++) {
                sheet.autoSizeColumn(c);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            wb.write(baos);
            byte[] bytes = baos.toByteArray();

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
        } catch (Exception e) {
            log.error("Failed to export salary statement: {}", e.getMessage());
            throw new RuntimeException("Failed to export salary statement", e);
        }
    }

    /**
     * Generate a blank sample salary statement template with demo rows.
     */
    public ResponseEntity<byte[]> generateSampleStatement() {
        String filename = "Salary_Statement_Sample.xlsx";

        Company company = companyService.getCompany();
        String companyName = company != null && company.getCompanyName() != null && !company.getCompanyName().isBlank()
            ? company.getCompanyName() : "Company Name";
        String companyAddr = company != null && company.getAddress() != null && !company.getAddress().isBlank()
            ? company.getAddress() : "Company Address";
        String regNo = company != null && company.getGstNumber() != null && !company.getGstNumber().isBlank()
            ? company.getGstNumber() : "GST/Reg No";

        List<Employee> employees = employeeRepository.findAllLiveEmployees();
        Employee sampleEmp = (employees != null && !employees.isEmpty()) ? employees.get(0) : null;
        String sampleCode = sampleEmp != null && sampleEmp.getEmployeeCode() != null ? sampleEmp.getEmployeeCode() : "PARI0001";
        String sampleName = sampleEmp != null ? safeStr(sampleEmp.getFullName()) : "Sample Employee";
        String sampleDoj = sampleEmp != null && sampleEmp.getDoj() != null
            ? sampleEmp.getDoj().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "01/01/2026";

        SalaryMaster sm = (sampleEmp != null) ? salaryMasterRepository.findByEmployeeId(sampleEmp.getId()).orElse(null) : null;

        BigDecimal basic = (sm != null && sm.getBasic() != null && sm.getBasic().compareTo(BigDecimal.ZERO) > 0)
            ? sm.getBasic() : new BigDecimal("25000.00");
        BigDecimal hra = (sm != null && sm.getHra() != null && sm.getHra().compareTo(BigDecimal.ZERO) > 0)
            ? sm.getHra() : new BigDecimal("5000.00");
        BigDecimal fpa = (sm != null && sm.getFixedPersonalAllowance() != null && sm.getFixedPersonalAllowance().compareTo(BigDecimal.ZERO) > 0)
            ? sm.getFixedPersonalAllowance() : new BigDecimal("3000.00");
        BigDecimal oa = (sm != null && sm.getOtherAllowance() != null && sm.getOtherAllowance().compareTo(BigDecimal.ZERO) > 0)
            ? sm.getOtherAllowance() : new BigDecimal("2000.00");
        BigDecimal rateGross = basic.add(hra).add(fpa).add(oa);

        BigDecimal ot = (sm != null && sm.getOvertimeWages() != null) ? sm.getOvertimeWages() : BigDecimal.ZERO;
        BigDecimal grossPayable = rateGross.add(ot);

        BigDecimal pf = (sm != null && sm.getPfDeduction() != null && sm.getPfDeduction().compareTo(BigDecimal.ZERO) > 0)
            ? sm.getPfDeduction() : new BigDecimal("1800.00");
        BigDecimal esi = (sm != null && sm.getEsiDeduction() != null && sm.getEsiDeduction().compareTo(BigDecimal.ZERO) > 0)
            ? sm.getEsiDeduction() : new BigDecimal("187.50");
        BigDecimal pt = (sm != null && sm.getPtDeduction() != null && sm.getPtDeduction().compareTo(BigDecimal.ZERO) > 0)
            ? sm.getPtDeduction() : new BigDecimal("200.00");
        BigDecimal hi = (sm != null && sm.getHealthInsurance() != null && sm.getHealthInsurance().compareTo(BigDecimal.ZERO) > 0)
            ? sm.getHealthInsurance() : BigDecimal.ZERO;
        BigDecimal totalDed = pf.add(esi).add(pt).add(hi);
        BigDecimal netPay = grossPayable.subtract(totalDed);

        String paymentDate = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String periodLabel = Month.of(LocalDate.now().getMonthValue()).name().charAt(0)
            + Month.of(LocalDate.now().getMonthValue()).name().substring(1).toLowerCase() + " " + LocalDate.now().getYear();

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Sheet1");

            Font boldFont = wb.createFont();
            boldFont.setBold(true);

            CellStyle boldStyle = wb.createCellStyle();
            boldStyle.setFont(boldFont);

            CellStyle headerStyle = wb.createCellStyle();
            headerStyle.setFont(boldFont);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            CellStyle dataStyle = wb.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            CellStyle numStyle = wb.createCellStyle();
            numStyle.setBorderBottom(BorderStyle.THIN);
            numStyle.setBorderTop(BorderStyle.THIN);
            numStyle.setBorderLeft(BorderStyle.THIN);
            numStyle.setBorderRight(BorderStyle.THIN);
            numStyle.setDataFormat(wb.createDataFormat().getFormat("#,##0.00"));
            numStyle.setAlignment(HorizontalAlignment.RIGHT);

            CellStyle demoStyle = wb.createCellStyle();
            demoStyle.setBorderBottom(BorderStyle.THIN);
            demoStyle.setBorderTop(BorderStyle.THIN);
            demoStyle.setBorderLeft(BorderStyle.THIN);
            demoStyle.setBorderRight(BorderStyle.THIN);
            demoStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            demoStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Row 1: Company name
            Row r1 = sheet.createRow(0);
            setCell(r1, 0, "Name of the Establishment :", boldStyle);
            setCell(r1, 2, companyName, dataStyle);

            // Row 2: Address
            Row r2 = sheet.createRow(1);
            setCell(r2, 0, "Address :", boldStyle);
            setCell(r2, 2, companyAddr, dataStyle);

            // Row 4: Registration No
            Row r4 = sheet.createRow(3);
            setCell(r4, 0, "Registration No", boldStyle);
            setCell(r4, 1, regNo, dataStyle);

            // Row 6: Wages period
            Row r6 = sheet.createRow(5);
            setCell(r6, 0, "Wages period - " + periodLabel, boldStyle);

            // Row 7-8: Headers
            Row r7 = sheet.createRow(6);
            String[] h7 = {"Sl.No", "Name of the Employee", "Employee Code", "Date of Appointment",
                "Rate of wages", "", "", "", "",
                "Normal wages earned", "", "", "", "",
                "No. of working day", "LOP", "Employee Effective Workdays",
                "Wages Earned for Overtime Work", "Gross Wages Payable",
                "Deductions", "", "", "",
                "Actual Wages Paid", "Date of Payment", "Signature or thumb impression of the employee", ""};
            for (int c = 0; c < h7.length; c++) {
                setCell(r7, c, h7[c], headerStyle);
            }

            Row r8 = sheet.createRow(7);
            String[] h8 = {"", "", "", "",
                "Basic", "HRA", "Fixed Personal Allow", "Oth. Allowance", "Gross Salary",
                "Basic", "HRA", "Fixed Personal Allow", "Oth. Allowance", "Gross Salary",
                "", "", "", "", "",
                "PF", "ESI", "PT", "HEALTH INSURANCE",
                "", "", ""};
            for (int c = 0; c < h8.length; c++) {
                setCell(r8, c, h8[c], headerStyle);
            }

            // Rows 9-11: empty

            // Exactly 1 demo data row with live employee info highlighted in yellow
            int rowIdx = 11;
            Row row = sheet.createRow(rowIdx++);
            int col = 0;
            setCell(row, col++, "1", demoStyle);
            setCell(row, col++, sampleName, demoStyle);
            setCell(row, col++, sampleCode, demoStyle);
            setCell(row, col++, sampleDoj, demoStyle);

            // Rate of wages (Basic, HRA, FPA, OA, Gross)
            setNumCell(row, col++, basic, demoStyle);
            setNumCell(row, col++, hra, demoStyle);
            setNumCell(row, col++, fpa, demoStyle);
            setNumCell(row, col++, oa, demoStyle);
            setNumCell(row, col++, rateGross, demoStyle);

            // Normal wages earned (Basic, HRA, FPA, OA, Gross)
            setNumCell(row, col++, basic, demoStyle);
            setNumCell(row, col++, hra, demoStyle);
            setNumCell(row, col++, fpa, demoStyle);
            setNumCell(row, col++, oa, demoStyle);
            setNumCell(row, col++, rateGross, demoStyle);

            // No of working days, LOP, Effective workdays
            setCell(row, col++, "26", demoStyle);
            setCell(row, col++, "0", demoStyle);
            setCell(row, col++, "26", demoStyle);

            // Overtime, Gross Wages Payable
            setNumCell(row, col++, ot, demoStyle);
            setNumCell(row, col++, grossPayable, demoStyle);

            // Deductions: PF, ESI, PT, Health Insurance
            setNumCell(row, col++, pf, demoStyle);
            setNumCell(row, col++, esi, demoStyle);
            setNumCell(row, col++, pt, demoStyle);
            setNumCell(row, col++, hi, demoStyle);

            // Actual wages paid, Date of payment, Sign, Remarks
            setNumCell(row, col++, netPay, demoStyle);
            setCell(row, col++, paymentDate, demoStyle);
            setCell(row, col++, "", demoStyle);
            setCell(row, col++, "", demoStyle);

            // Note row
            Row noteRow = sheet.createRow(rowIdx + 1);
            CellStyle noteStyle = wb.createCellStyle();
            Font italicFont = wb.createFont();
            italicFont.setItalic(true);
            italicFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            noteStyle.setFont(italicFont);
            setCell(noteRow, 0, "Note: Rows highlighted in yellow are sample live employee data — update values or add more employees as needed before uploading.", noteStyle);

            for (int c = 0; c < 27; c++) {
                sheet.autoSizeColumn(c);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            wb.write(baos);
            byte[] bytes = baos.toByteArray();

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
        } catch (Exception e) {
            log.error("Failed to generate sample statement: {}", e.getMessage());
            throw new RuntimeException("Failed to generate sample statement", e);
        }
    }

    private void setCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    private void setNumCell(Row row, int col, BigDecimal value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value.doubleValue() : 0.0);
        cell.setCellStyle(style);
    }

    private BigDecimal safe(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    private String safeStr(String s) {
        return s != null ? s : "";
    }
}
