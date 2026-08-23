package com.ems.service;

import com.ems.model.*;
import com.ems.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatutoryReportService {

    private final SalaryRepository salaryRepository;
    private final SalaryMasterRepository salaryMasterRepository;
    private final LeaveApplicationRepository leaveApplicationRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;

    private static final String[] MONTH_NAMES = {
        "", "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    };

    private Company getCompany() {
        return companyRepository.findAll().stream().findFirst()
            .orElse(Company.builder()
                .companyName("Parikar Business & Knowledge Services (P) ltd.")
                .address("ECCO Greens Tech Hub, Upadhyaya Nagar, Trupati - 517 507. A.P")
                .registrationNumber("AP-10-11-1-2218597")
                .cinNumber("U74140KA2009PTC051963")
                .build());
    }

    private String getCompanyRegNo(Company company) {
        if (company.getRegistrationNumber() != null && !company.getRegistrationNumber().isBlank()) {
            return company.getRegistrationNumber();
        }
        if (company.getCinNumber() != null && !company.getCinNumber().isBlank()) {
            return company.getCinNumber();
        }
        return "AP-10-11-1-2218597";
    }

    private List<Salary> getSalariesForPeriod(Integer year, Integer month) {
        List<Salary> salaries = salaryRepository.findByWageYearAndWageMonth(year, month);
        return salaries != null ? salaries : Collections.emptyList();
    }

    // =========================================================================
    // 1. INDIVIDUAL WORKER DETAILS (Register of Employment - worker details.jpeg)
    // =========================================================================

    public String generateIndividualWorkerDetails(Integer year, Integer month) {
        Company company = getCompany();
        List<Salary> salaries = getSalariesForPeriod(year, month);
        String monthName = MONTH_NAMES[month];
        String regNo = getCompanyRegNo(company);

        if (salaries.isEmpty()) {
            return "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Individual Worker Details - " + monthName + " " + year + "</title>"
                + "<style>body{font-family:Arial,sans-serif;background:#f8fafc;padding:40px;margin:0;}</style></head><body>"
                + "<div style='background:#fff; border:1px solid #e2e8f0; box-shadow:0 4px 12px rgba(0,0,0,0.05); padding:36px; border-radius:12px; text-align:center; max-width:620px; margin:40px auto;'>"
                + "<div style='font-size:38px; margin-bottom:12px;'>💼</div>"
                + "<h2 style='margin:0 0 10px 0; color:#1e293b; font-size:20px; font-weight:700;'>Monthly Payroll Not Processed</h2>"
                + "<p style='margin:0 0 14px 0; font-size:13.5px; color:#475569; line-height:1.5;'>"
                + "No monthly payroll records were found for <strong>" + monthName + " " + year + "</strong> in the system."
                + "</p>"
                + "<div style='background:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:12px 16px; margin-top:16px; font-size:12px; color:#92400e; text-align:left; line-height:1.5;'>"
                + "<strong>Note:</strong> The Register of Employment is generated strictly from the monthly payroll Excel uploaded by the auditor under <em>Payroll &gt; Process</em>. Please upload and process the monthly payroll for this month to view the register."
                + "</div>"
                + "</div></body></html>";
        }

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body{font-family:Arial,sans-serif;margin:20px;font-size:12px;}");
        html.append("h2{text-align:center;margin:5px 0;font-size:16px;font-weight:bold;}");
        html.append("table{width:100%;border-collapse:collapse;margin-top:12px;}");
        html.append("th,td{border:1px solid #000;padding:6px 8px;text-align:center;font-size:11px;}");
        html.append("th{background:#f0f0f0;font-weight:bold;}");
        html.append(".info{margin:4px 0;font-size:12px;}");
        html.append("@media print{body{margin:10px;}}");
        html.append("</style></head><body>");

        html.append("<h2>Individual Worker Details</h2>");
        html.append("<div class='info'><b>Name of the Establishment :</b> ").append(company.getCompanyName()).append("</div>");
        html.append("<div class='info'><b>Address :</b> ").append(company.getAddress()).append("</div>");
        html.append("<div class='info'><b>Registration No -</b> ").append(regNo).append("</div>");
        html.append("<div class='info'><b>Wages period -</b> ").append(monthName).append(", ").append(year).append("</div>");

        html.append("<table><thead><tr>");
        html.append("<th>Sl.No</th><th>Name of the Employee</th><th>Employee Code</th>");
        html.append("<th>Designation</th><th>Gender</th><th>Working Since</th>");
        html.append("<th>Wages as per Scheduled Employment</th><th>Actual wages Paid</th>");
        html.append("<th>No of Working Hours per Day</th><th>OT Wages already paid if any</th>");
        html.append("<th>Weekly Off Allowed or not</th><th>Wages Paid(D/W/M)</th><th>Worker Type</th>");
        html.append("</tr></thead><tbody>");

        int sl = 1;
        for (Salary s : salaries) {
            html.append("<tr>");
            html.append("<td>").append(sl++).append("</td>");
            html.append("<td style='text-align:left'>").append(s.getEmployee().getFullName()).append("</td>");
            html.append("<td>").append(s.getEmployee().getEmployeeCode()).append("</td>");
            html.append("<td>").append(s.getEmployee().getDesignation() != null ? s.getEmployee().getDesignation() : "-").append("</td>");
            html.append("<td>").append(s.getEmployee().getGender() != null ? s.getEmployee().getGender() : "-").append("</td>");
            html.append("<td>").append(s.getEmployee().getDoj() != null ? s.getEmployee().getDoj().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) : "-").append("</td>");
            html.append("<td>&#8377; ").append(String.format("%,.2f", s.getGrossSalary())).append("</td>");
            html.append("<td>&#8377; ").append(String.format("%,.2f", s.getNetPay())).append("</td>");
            html.append("<td>").append(s.getWorkingHoursPerDay() != null ? s.getWorkingHoursPerDay() : "8").append("</td>");
            html.append("<td>").append(s.getOvertimeWages() != null && s.getOvertimeWages().compareTo(BigDecimal.ZERO) > 0 ? ("&#8377; " + String.format("%,.2f", s.getOvertimeWages())) : "-").append("</td>");
            html.append("<td>").append(s.getWeeklyOff() != null ? s.getWeeklyOff() : "Allowed").append("</td>");
            html.append("<td>M</td>");
            html.append("<td>").append(s.getWorkerType() != null ? s.getWorkerType() : "Permanent").append("</td>");
            html.append("</tr>");
        }

        html.append("</tbody></table></body></html>");
        return html.toString();
    }

    public byte[] generateIndividualWorkerDetailsExcel(Integer year, Integer month) {
        Company company = getCompany();
        List<Salary> salaries = getSalariesForPeriod(year, month);
        String monthName = MONTH_NAMES[month];
        String regNo = getCompanyRegNo(company);

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Individual Worker Details");
            CellStyle titleStyle = createTitleStyle(wb);
            CellStyle infoStyle = createInfoStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dataStyle = createDataStyle(wb);
            CellStyle currencyStyle = createCurrencyStyle(wb);

            int r = 0;
            createTitleRow(sheet, r++, 13, "Individual Worker Details", titleStyle);
            r = createInfoRow(sheet, r, "Name of the Establishment", company.getCompanyName(), infoStyle, 13);
            r = createInfoRow(sheet, r, "Address", safeStr(company.getAddress()), infoStyle, 13);
            r = createInfoRow(sheet, r, "Registration No", regNo, infoStyle, 13);
            r = createInfoRow(sheet, r, "Wages period", monthName + ", " + year, infoStyle, 13);

            if (salaries.isEmpty()) {
                createMergedRow(sheet, r++, 13, "Notice: No monthly payroll records found for " + monthName + " " + year + " in the database.", infoStyle);
                wb.write(out);
                return out.toByteArray();
            }

            r++;

            String[] headers = {"Sl.No", "Name of the Employee", "Employee Code", "Designation", "Gender",
                "Working Since", "Wages as per Scheduled Employment", "Actual wages Paid",
                "No of Working Hours per Day", "OT Wages already paid if any", "Weekly Off Allowed or not", "Wages Paid(D/W/M)", "Worker Type"};
            createHeaderRow(sheet, r, headers, headerStyle);
            r++;

            int sl = 1;
            for (Salary s : salaries) {
                Row row = sheet.createRow(r++);
                createCell(row, 0, sl++, dataStyle);
                createCell(row, 1, safeStr(s.getEmployee().getFullName()), dataStyle);
                createCell(row, 2, safeStr(s.getEmployee().getEmployeeCode()), dataStyle);
                createCell(row, 3, safeStr(s.getEmployee().getDesignation()), dataStyle);
                createCell(row, 4, safeStr(s.getEmployee().getGender()), dataStyle);
                createCell(row, 5, s.getEmployee().getDoj() != null ? s.getEmployee().getDoj().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) : "-", dataStyle);
                createCell(row, 6, s.getGrossSalary(), currencyStyle);
                createCell(row, 7, s.getNetPay(), currencyStyle);
                createCell(row, 8, s.getWorkingHoursPerDay() != null ? s.getWorkingHoursPerDay() : 8, dataStyle);
                createCell(row, 9, s.getOvertimeWages() != null && s.getOvertimeWages().compareTo(BigDecimal.ZERO) > 0 ? s.getOvertimeWages().doubleValue() : 0, currencyStyle);
                createCell(row, 10, safeStr(s.getWeeklyOff()), dataStyle);
                createCell(row, 11, "M", dataStyle);
                createCell(row, 12, safeStr(s.getWorkerType()), dataStyle);
            }

            for (int i = 0; i < 13; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error generating Individual Worker Details Excel", e);
            throw new RuntimeException("Failed to generate Excel", e);
        }
    }

    // =========================================================================
    // 2. WAGES REGISTER (wage register.xlsx / wage register.jpeg)
    // =========================================================================

    public String generateWagesRegister(Integer year, Integer month) {
        Company company = getCompany();
        List<Salary> salaries = getSalariesForPeriod(year, month);
        String monthName = MONTH_NAMES[month];
        String regNo = getCompanyRegNo(company);

        if (salaries.isEmpty()) {
            return "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Wages Register - " + monthName + " " + year + "</title>"
                + "<style>body{font-family:Arial,sans-serif;background:#f8fafc;padding:40px;margin:0;}</style></head><body>"
                + "<div style='background:#fff; border:1px solid #e2e8f0; box-shadow:0 4px 12px rgba(0,0,0,0.05); padding:36px; border-radius:12px; text-align:center; max-width:620px; margin:40px auto;'>"
                + "<div style='font-size:38px; margin-bottom:12px;'>💰</div>"
                + "<h2 style='margin:0 0 10px 0; color:#1e293b; font-size:20px; font-weight:700;'>Monthly Wages Not Processed</h2>"
                + "<p style='margin:0 0 14px 0; font-size:13.5px; color:#475569; line-height:1.5;'>"
                + "No processed monthly wage records were found for <strong>" + monthName + " " + year + "</strong> in the system."
                + "</p>"
                + "<div style='background:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:12px 16px; margin-top:16px; font-size:12px; color:#92400e; text-align:left; line-height:1.5;'>"
                + "<strong>Note:</strong> The statutory Wages Register is generated strictly from the monthly payroll Excel uploaded by the auditor under <em>Payroll &gt; Process</em>. Please upload and process the monthly salary file for this month to generate the register."
                + "</div>"
                + "</div></body></html>";
        }

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body{font-family:Arial,sans-serif;margin:15px;font-size:11px;}");
        html.append("h2{text-align:center;margin:4px 0;font-size:15px;}");
        html.append("table{width:100%;border-collapse:collapse;margin-top:8px;}");
        html.append("th,td{border:1px solid #000;padding:4px 5px;text-align:center;font-size:10px;white-space:nowrap;}");
        html.append("th{background:#e8edf5;font-weight:bold;}");
        html.append(".info{margin:3px 0;font-size:11px;}");
        html.append("@media print{body{margin:8px;}}");
        html.append("</style></head><body>");

        html.append("<h2>Wages Register</h2>");
        html.append("<div class='info'><b>Name of the Establishment :</b> ").append(company.getCompanyName()).append("</div>");
        html.append("<div class='info'><b>Address :</b> ").append(company.getAddress()).append("</div>");
        html.append("<div class='info'><b>Registration No :</b> ").append(regNo).append("</div>");
        html.append("<div class='info'><b>Wages period -</b> ").append(monthName).append(" ").append(year).append("</div>");

        html.append("<table><thead><tr>");
        html.append("<th rowspan='2'>Sl.No</th><th rowspan='2'>Name of the Employee</th>");
        html.append("<th rowspan='2'>Employee Code</th><th rowspan='2'>Date of Appointment</th>");
        html.append("<th colspan='5'>Rate of wages</th>");
        html.append("<th colspan='5'>Normal wages earned</th>");
        html.append("<th rowspan='2'>No. of working day</th>");
        html.append("<th rowspan='2'>LOP</th>");
        html.append("<th rowspan='2'>Employee Effective Workdays</th>");
        html.append("<th rowspan='2'>Wages Earned for Overtime Work</th>");
        html.append("<th rowspan='2'>Gross Wages Payable</th>");
        html.append("<th colspan='4'>Deductions</th>");
        html.append("<th rowspan='2'>Actual Wages Paid</th>");
        html.append("<th rowspan='2'>Date of Payment</th>");
        html.append("<th rowspan='2'>Signature or thumb impresession of the employee</th>");
        html.append("</tr><tr>");
        html.append("<th>Basic</th><th>HRA</th><th>Fixed Personal Allow</th><th>Oth. Allowance</th><th>Gross Salary</th>");
        html.append("<th>Basic</th><th>HRA</th><th>Fixed Personal Allow</th><th>Oth. Allowance</th><th>Gross Salary</th>");
        html.append("<th>PF</th><th>ESI</th><th>PT</th><th>HEALTH INSURANCE</th>");
        html.append("</tr></thead><tbody>");

        int sl = 1;
        BigDecimal totalRateBasic = BigDecimal.ZERO, totalRateHra = BigDecimal.ZERO, totalRateFpa = BigDecimal.ZERO, totalRateOther = BigDecimal.ZERO, totalRateGross = BigDecimal.ZERO;
        BigDecimal totalEarnedBasic = BigDecimal.ZERO, totalEarnedHra = BigDecimal.ZERO, totalEarnedFpa = BigDecimal.ZERO, totalEarnedOther = BigDecimal.ZERO, totalEarnedGross = BigDecimal.ZERO;
        BigDecimal totalPf = BigDecimal.ZERO, totalEsi = BigDecimal.ZERO, totalPt = BigDecimal.ZERO, totalHealthIns = BigDecimal.ZERO;
        BigDecimal totalOt = BigDecimal.ZERO, totalNet = BigDecimal.ZERO;

        int daysInMonth = YearMonth.of(year, month).lengthOfMonth();

        for (Salary s : salaries) {
            totalRateBasic = totalRateBasic.add(safe(s.getBasic()));
            totalRateHra = totalRateHra.add(safe(s.getHra()));
            totalRateFpa = totalRateFpa.add(safe(s.getFixedPersonalAllowance()));
            totalRateOther = totalRateOther.add(safe(s.getOtherAllowance()));
            totalRateGross = totalRateGross.add(safe(s.getGrossSalary()));

            totalEarnedBasic = totalEarnedBasic.add(safe(s.getBasic()));
            totalEarnedHra = totalEarnedHra.add(safe(s.getHra()));
            totalEarnedFpa = totalEarnedFpa.add(safe(s.getFixedPersonalAllowance()));
            totalEarnedOther = totalEarnedOther.add(safe(s.getOtherAllowance()));
            totalEarnedGross = totalEarnedGross.add(safe(s.getGrossSalary()));

            totalPf = totalPf.add(safe(s.getPfDeduction()));
            totalEsi = totalEsi.add(safe(s.getEsiDeduction()));
            totalPt = totalPt.add(safe(s.getPtDeduction()));
            totalHealthIns = totalHealthIns.add(safe(s.getHealthInsurance()));
            totalOt = totalOt.add(safe(s.getOvertimeWages()));
            totalNet = totalNet.add(safe(s.getNetPay()));

            html.append("<tr>");
            html.append("<td>").append(sl++).append("</td>");
            html.append("<td style='text-align:left'>").append(s.getEmployee().getFullName()).append("</td>");
            html.append("<td>").append(s.getEmployee().getEmployeeCode()).append("</td>");
            html.append("<td>").append(s.getEmployee().getDoj() != null ? s.getEmployee().getDoj().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "-").append("</td>");

            // Rate of wages
            html.append("<td>").append(fmt(s.getBasic())).append("</td>");
            html.append("<td>").append(fmt(s.getHra())).append("</td>");
            html.append("<td>").append(fmt(s.getFixedPersonalAllowance())).append("</td>");
            html.append("<td>").append(fmt(s.getOtherAllowance())).append("</td>");
            html.append("<td>").append(fmt(s.getGrossSalary())).append("</td>");

            // Normal wages earned
            html.append("<td>").append(fmt(s.getBasic())).append("</td>");
            html.append("<td>").append(fmt(s.getHra())).append("</td>");
            html.append("<td>").append(fmt(s.getFixedPersonalAllowance())).append("</td>");
            html.append("<td>").append(fmt(s.getOtherAllowance())).append("</td>");
            html.append("<td>").append(fmt(s.getGrossSalary())).append("</td>");

            // Working days, LOP, Effective days
            html.append("<td>").append(daysInMonth).append("</td>");
            html.append("<td>0</td>");
            html.append("<td>").append(daysInMonth).append("</td>");

            // OT & Gross payable
            html.append("<td>").append(fmt(s.getOvertimeWages())).append("</td>");
            html.append("<td>").append(fmt(s.getGrossSalary())).append("</td>");

            // Deductions
            html.append("<td>").append(fmt(s.getPfDeduction())).append("</td>");
            html.append("<td>").append(fmt(s.getEsiDeduction())).append("</td>");
            html.append("<td>").append(fmt(s.getPtDeduction())).append("</td>");
            html.append("<td>").append(fmt(s.getHealthInsurance())).append("</td>");

            // Actual Paid, Date, Signature
            html.append("<td>").append(fmt(s.getNetPay())).append("</td>");
            html.append("<td>").append(s.getDateOfPayment() != null ? s.getDateOfPayment().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "-").append("</td>");
            html.append("<td></td>");
            html.append("</tr>");
        }

        html.append("<tr style='font-weight:bold;background:#f0f4ff'>");
        html.append("<td colspan='4'>Total</td>");
        html.append("<td>").append(fmt(totalRateBasic)).append("</td>");
        html.append("<td>").append(fmt(totalRateHra)).append("</td>");
        html.append("<td>").append(fmt(totalRateFpa)).append("</td>");
        html.append("<td>").append(fmt(totalRateOther)).append("</td>");
        html.append("<td>").append(fmt(totalRateGross)).append("</td>");

        html.append("<td>").append(fmt(totalEarnedBasic)).append("</td>");
        html.append("<td>").append(fmt(totalEarnedHra)).append("</td>");
        html.append("<td>").append(fmt(totalEarnedFpa)).append("</td>");
        html.append("<td>").append(fmt(totalEarnedOther)).append("</td>");
        html.append("<td>").append(fmt(totalEarnedGross)).append("</td>");

        html.append("<td colspan='3'></td>");
        html.append("<td>").append(fmt(totalOt)).append("</td>");
        html.append("<td>").append(fmt(totalEarnedGross)).append("</td>");

        html.append("<td>").append(fmt(totalPf)).append("</td>");
        html.append("<td>").append(fmt(totalEsi)).append("</td>");
        html.append("<td>").append(fmt(totalPt)).append("</td>");
        html.append("<td>").append(fmt(totalHealthIns)).append("</td>");

        html.append("<td>").append(fmt(totalNet)).append("</td>");
        html.append("<td colspan='2'></td>");
        html.append("</tr>");

        html.append("</tbody></table></body></html>");
        return html.toString();
    }

    public byte[] generateWagesRegisterExcel(Integer year, Integer month) {
        Company company = getCompany();
        List<Salary> salaries = getSalariesForPeriod(year, month);
        String monthName = MONTH_NAMES[month];
        int daysInMonth = YearMonth.of(year, month).lengthOfMonth();
        String regNo = getCompanyRegNo(company);

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Wages Register");
            CellStyle titleStyle = createTitleStyle(wb);
            CellStyle infoStyle = createInfoStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dataStyle = createDataStyle(wb);
            CellStyle currencyStyle = createCurrencyStyle(wb);
            CellStyle totalStyle = createTotalStyle(wb);

            int r = 0;
            // Row 1: Name of Establishment
            Row rowComp = sheet.createRow(r++);
            createCell(rowComp, 0, "Name of the Establishment :", infoStyle);
            createCell(rowComp, 2, company.getCompanyName(), titleStyle);

            // Row 2: Address
            Row rowAddr = sheet.createRow(r++);
            createCell(rowAddr, 0, "Address :", infoStyle);
            createCell(rowAddr, 2, safeStr(company.getAddress()), infoStyle);
            r++;

            // Row 4: Reg No
            Row rowReg = sheet.createRow(r++);
            createCell(rowReg, 0, "Registration No ", infoStyle);
            createCell(rowReg, 1, regNo, infoStyle);
            r++;

            // Row 6: Wages Period
            Row rowPeriod = sheet.createRow(r++);
            createCell(rowPeriod, 0, "Wages period - " + monthName + " " + year, infoStyle);

            if (salaries.isEmpty()) {
                createMergedRow(sheet, r++, 25, "Notice: No processed monthly wage records found for " + monthName + " " + year + " in the database.", infoStyle);
                wb.write(out);
                return out.toByteArray();
            }

            // Double header rows (Matching wage register.xlsx)
            int headerRow1Num = r;
            int headerRow2Num = r + 1;
            Row hRow1 = sheet.createRow(r++);
            Row hRow2 = sheet.createRow(r++);

            String[] topHeaders = {
                "Sl.No", "Name of the Employee", "Employee Code", "Date of Appointment",
                "Rate of wages", "", "", "", "",
                "Normal wages earned", "", "", "", "",
                "No. of working day", "LOP", "Employee Effective Workdays",
                "Wages Earned for Overtime Work", "Gross Wages Payable",
                "Deductions ", "", "", "",
                "Actual Wages Paid", "Date of Payment", "Signature or thumb impresession of the employee"
            };

            for (int i = 0; i < topHeaders.length; i++) {
                createCell(hRow1, i, topHeaders[i], headerStyle);
            }

            // Merges on top row
            sheet.addMergedRegion(new CellRangeAddress(headerRow1Num, headerRow2Num, 0, 0));
            sheet.addMergedRegion(new CellRangeAddress(headerRow1Num, headerRow2Num, 1, 1));
            sheet.addMergedRegion(new CellRangeAddress(headerRow1Num, headerRow2Num, 2, 2));
            sheet.addMergedRegion(new CellRangeAddress(headerRow1Num, headerRow2Num, 3, 3));
            sheet.addMergedRegion(new CellRangeAddress(headerRow1Num, headerRow1Num, 4, 8));
            sheet.addMergedRegion(new CellRangeAddress(headerRow1Num, headerRow1Num, 9, 13));
            sheet.addMergedRegion(new CellRangeAddress(headerRow1Num, headerRow2Num, 14, 14));
            sheet.addMergedRegion(new CellRangeAddress(headerRow1Num, headerRow2Num, 15, 15));
            sheet.addMergedRegion(new CellRangeAddress(headerRow1Num, headerRow2Num, 16, 16));
            sheet.addMergedRegion(new CellRangeAddress(headerRow1Num, headerRow2Num, 17, 17));
            sheet.addMergedRegion(new CellRangeAddress(headerRow1Num, headerRow2Num, 18, 18));
            sheet.addMergedRegion(new CellRangeAddress(headerRow1Num, headerRow1Num, 19, 22));
            sheet.addMergedRegion(new CellRangeAddress(headerRow1Num, headerRow2Num, 23, 23));
            sheet.addMergedRegion(new CellRangeAddress(headerRow1Num, headerRow2Num, 24, 24));
            sheet.addMergedRegion(new CellRangeAddress(headerRow1Num, headerRow2Num, 25, 25));

            String[] subHeaders = {
                "", "", "", "",
                "Basic", "HRA", "Fixed Personal Allow", "Oth. Allowance", "Gross Salary",
                "Basic", "HRA", "Fixed Personal Allow", "Oth. Allowance", "Gross Salary",
                "", "", "", "", "",
                "PF", "ESI", "PT", "HEALTH INSURANCE",
                "", "", ""
            };

            for (int i = 0; i < subHeaders.length; i++) {
                createCell(hRow2, i, subHeaders[i], headerStyle);
            }

            BigDecimal tRateBasic = BigDecimal.ZERO, tRateHra = BigDecimal.ZERO, tRateFpa = BigDecimal.ZERO, tRateOther = BigDecimal.ZERO, tRateGross = BigDecimal.ZERO;
            BigDecimal tEarnedBasic = BigDecimal.ZERO, tEarnedHra = BigDecimal.ZERO, tEarnedFpa = BigDecimal.ZERO, tEarnedOther = BigDecimal.ZERO, tEarnedGross = BigDecimal.ZERO;
            BigDecimal tPf = BigDecimal.ZERO, tEsi = BigDecimal.ZERO, tPt = BigDecimal.ZERO, tHealthIns = BigDecimal.ZERO;
            BigDecimal tOt = BigDecimal.ZERO, tNet = BigDecimal.ZERO;

            int sl = 1;
            for (Salary s : salaries) {
                Row row = sheet.createRow(r++);
                createCell(row, 0, sl++, dataStyle);
                createCell(row, 1, safeStr(s.getEmployee().getFullName()), dataStyle);
                createCell(row, 2, safeStr(s.getEmployee().getEmployeeCode()), dataStyle);
                createCell(row, 3, s.getEmployee().getDoj() != null ? s.getEmployee().getDoj().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "-", dataStyle);

                // Rate of wages
                createCell(row, 4, s.getBasic(), currencyStyle);
                createCell(row, 5, s.getHra(), currencyStyle);
                createCell(row, 6, s.getFixedPersonalAllowance(), currencyStyle);
                createCell(row, 7, s.getOtherAllowance(), currencyStyle);
                createCell(row, 8, s.getGrossSalary(), currencyStyle);

                // Normal wages earned
                createCell(row, 9, s.getBasic(), currencyStyle);
                createCell(row, 10, s.getHra(), currencyStyle);
                createCell(row, 11, s.getFixedPersonalAllowance(), currencyStyle);
                createCell(row, 12, s.getOtherAllowance(), currencyStyle);
                createCell(row, 13, s.getGrossSalary(), currencyStyle);

                // Days
                createCell(row, 14, daysInMonth, dataStyle);
                createCell(row, 15, 0, dataStyle);
                createCell(row, 16, daysInMonth, dataStyle);

                // OT & Gross Payable
                createCell(row, 17, s.getOvertimeWages(), currencyStyle);
                createCell(row, 18, s.getGrossSalary(), currencyStyle);

                // Deductions
                createCell(row, 19, s.getPfDeduction(), currencyStyle);
                createCell(row, 20, s.getEsiDeduction(), currencyStyle);
                createCell(row, 21, s.getPtDeduction(), currencyStyle);
                createCell(row, 22, s.getHealthInsurance(), currencyStyle);

                // Actual Wages, Date, Sig
                createCell(row, 23, s.getNetPay(), currencyStyle);
                createCell(row, 24, s.getDateOfPayment() != null ? s.getDateOfPayment().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "-", dataStyle);
                createCell(row, 25, "", dataStyle);

                tRateBasic = tRateBasic.add(safeD(s.getBasic()));
                tRateHra = tRateHra.add(safeD(s.getHra()));
                tRateFpa = tRateFpa.add(safeD(s.getFixedPersonalAllowance()));
                tRateOther = tRateOther.add(safeD(s.getOtherAllowance()));
                tRateGross = tRateGross.add(safeD(s.getGrossSalary()));

                tEarnedBasic = tEarnedBasic.add(safeD(s.getBasic()));
                tEarnedHra = tEarnedHra.add(safeD(s.getHra()));
                tEarnedFpa = tEarnedFpa.add(safeD(s.getFixedPersonalAllowance()));
                tEarnedOther = tEarnedOther.add(safeD(s.getOtherAllowance()));
                tEarnedGross = tEarnedGross.add(safeD(s.getGrossSalary()));

                tPf = tPf.add(safeD(s.getPfDeduction()));
                tEsi = tEsi.add(safeD(s.getEsiDeduction()));
                tPt = tPt.add(safeD(s.getPtDeduction()));
                tHealthIns = tHealthIns.add(safeD(s.getHealthInsurance()));
                tOt = tOt.add(safeD(s.getOvertimeWages()));
                tNet = tNet.add(safeD(s.getNetPay()));
            }

            Row totalRow = sheet.createRow(r++);
            createCell(totalRow, 0, "Total", totalStyle);
            for (int i = 1; i < 4; i++) createCell(totalRow, i, "", totalStyle);

            createCell(totalRow, 4, tRateBasic, totalStyle);
            createCell(totalRow, 5, tRateHra, totalStyle);
            createCell(totalRow, 6, tRateFpa, totalStyle);
            createCell(totalRow, 7, tRateOther, totalStyle);
            createCell(totalRow, 8, tRateGross, totalStyle);

            createCell(totalRow, 9, tEarnedBasic, totalStyle);
            createCell(totalRow, 10, tEarnedHra, totalStyle);
            createCell(totalRow, 11, tEarnedFpa, totalStyle);
            createCell(totalRow, 12, tEarnedOther, totalStyle);
            createCell(totalRow, 13, tEarnedGross, totalStyle);

            createCell(totalRow, 14, "", totalStyle);
            createCell(totalRow, 15, "", totalStyle);
            createCell(totalRow, 16, "", totalStyle);

            createCell(totalRow, 17, tOt, totalStyle);
            createCell(totalRow, 18, tEarnedGross, totalStyle);

            createCell(totalRow, 19, tPf, totalStyle);
            createCell(totalRow, 20, tEsi, totalStyle);
            createCell(totalRow, 21, tPt, totalStyle);
            createCell(totalRow, 22, tHealthIns, totalStyle);

            createCell(totalRow, 23, tNet, totalStyle);
            createCell(totalRow, 24, "", totalStyle);
            createCell(totalRow, 25, "", totalStyle);

            for (int i = 0; i < 26; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error generating Wages Register Excel", e);
            throw new RuntimeException("Failed to generate Excel", e);
        }
    }

    // =========================================================================
    // 3. FORM XXV REGISTER OF LEAVE (form-xxv-sampleleave.xlsx)
    // =========================================================================

    public String generateLeaveRegister(Integer year) {
        Company company = getCompany();
        List<LeaveType> leaveTypes = leaveTypeRepository.findByIsActiveTrue();
        List<Employee> employees = employeeRepository.findAllLiveEmployees();

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body{font-family:Arial,sans-serif;margin:15px;font-size:11px;}");
        html.append(".rule-title{text-align:center;font-size:12px;margin:2px 0;}");
        html.append(".form-title{text-align:center;font-size:16px;font-weight:bold;margin:2px 0;}");
        html.append(".register-title{text-align:center;font-size:13px;font-weight:bold;margin:2px 0;}");
        html.append(".see-rule{text-align:center;font-size:11px;margin:2px 0;color:#333;}");
        html.append(".leave-wages{text-align:center;font-size:12px;font-weight:bold;margin:4px 0;}");
        html.append(".info-row{font-size:11px;margin:3px 0;}");
        html.append(".emp-section{margin-top:20px;page-break-after:always;border-top:2px solid #333;padding-top:12px;}");
        html.append(".emp-header{display:grid;grid-template-columns:1fr 1fr;font-size:11px;margin:8px 0;padding:6px 10px;background:#f9f9f9;border:1px solid #ccc;}");
        html.append(".emp-header div{padding:3px 0;}");
        html.append("table{width:100%;border-collapse:collapse;margin-top:6px;table-layout:fixed;}");
        html.append("th,td{border:1px solid #000;padding:4px 4px;text-align:center;font-size:10px;overflow:hidden;word-wrap:break-word;}");
        html.append("th{background:#D9D9D9;font-weight:bold;}");
        html.append(".opening-row td{background:#f9f9f9;font-style:italic;}");
        html.append("@media print{body{margin:10px;}.emp-section{page-break-inside:avoid;}}");
        html.append("</style></head><body>");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        for (Employee emp : employees) {
            List<LeaveBalance> empBalances = leaveBalanceRepository.findByEmployeeIdAndYear(emp.getId(), year);
            List<LeaveApplication> empApps = leaveApplicationRepository.findByEmployeeIdAndYear(emp.getId(), year);

            int clEntitled = 1, plEntitled = 19;
            for (LeaveBalance lb : empBalances) {
                if (lb.getLeaveType().getName().toUpperCase().contains("CL") || lb.getLeaveType().getName().contains("Casual")) {
                    clEntitled = lb.getEntitled() != null ? lb.getEntitled() : 1;
                } else if (lb.getLeaveType().getName().toUpperCase().contains("PL") || lb.getLeaveType().getName().contains("Privilege")) {
                    plEntitled = lb.getEntitled() != null ? lb.getEntitled() : 19;
                }
            }

            int clBal = clEntitled;
            int plBal = plEntitled;

            html.append("<div class='emp-section'>");
            html.append("<div class='info-row'><b>Name of the Establishment / Shop :</b> ").append(company.getCompanyName()).append("</div>");
            html.append("<div class='info-row'><b>Address :</b> ").append(safeStr(company.getAddress())).append("</div>");
            html.append("<div class='info-row'><b>Registration No. </b> ").append(getCompanyRegNo(company)).append("</div>");
            html.append("<div class='rule-title'>The Andhra Pradesh Shops and Establishments Rules</div>");
            html.append("<div class='form-title'>FORM - XXV</div>");
            html.append("<div class='register-title'>REGISTER OF LEAVE</div>");
            html.append("<div class='see-rule'>See Rule 29(6)</div>");
            html.append("<div class='leave-wages'>LEAVE WITH WAGES</div>");

            html.append("<div class='emp-header'>");
            html.append("<div><b>Name of the employee:</b> ").append(emp.getFullName()).append("</div>");
            html.append("<div><b>Employee Code:</b> ").append(emp.getEmployeeCode()).append("</div>");
            html.append("<div><b>Father's/Husband's Name:</b> ").append(safeStr(emp.getFatherHusbandName())).append("</div>");
            html.append("<div><b>Designation:</b> ").append(safeStr(emp.getDesignation())).append("</div>");
            html.append("<div><b>Date of appointment:</b> ").append(emp.getDoj() != null ? emp.getDoj().format(dtf) : "-").append("</div>");
            html.append("<div><b>Department:</b> ").append(safeStr(emp.getDepartment())).append("</div>");
            html.append("</div>");

            html.append("<table>");
            html.append("<thead>");
            html.append("<tr>");
            html.append("<th rowspan='2'>Date of<br>Application</th>");
            html.append("<th colspan='3'>Applied</th>");
            html.append("<th colspan='2'>No. of Days to which<br>the employee is entitled</th>");
            html.append("<th colspan='3'>Leave Granted</th>");
            html.append("<th colspan='2'>Balance</th>");
            html.append("<th colspan='4'>If refused, in part or full</th>");
            html.append("<th colspan='2'>Signature of</th>");
            html.append("<th rowspan='2'>Date of<br>Application</th>");
            html.append("</tr>");
            html.append("<tr>");
            html.append("<th>From</th><th>To</th><th>No. of Days</th>");
            html.append("<th>CL</th><th>PL</th>");
            html.append("<th>From</th><th>To</th><th>No. of Days</th>");
            html.append("<th>CL</th><th>PL</th>");
            html.append("<th>From</th><th>To</th><th>Days</th><th>Reason</th>");
            html.append("<th>Employee</th><th>Employer</th>");
            html.append("</tr>");
            html.append("</thead>");
            html.append("<tbody>");

            html.append("<tr class='opening-row'>");
            html.append("<td>Apr 1, ").append(year).append(" opening balance</td>");
            html.append("<td></td><td></td><td></td>");
            html.append("<td>").append(clEntitled).append("</td><td>").append(plEntitled).append("</td>");
            html.append("<td></td><td></td><td></td>");
            html.append("<td></td><td></td>");
            html.append("<td></td><td></td><td></td><td></td>");
            html.append("<td></td><td></td><td></td>");
            html.append("</tr>");

            java.util.List<LeaveApplication> sorted = new java.util.ArrayList<>(empApps);
            sorted.sort(java.util.Comparator.comparing(la -> la.getFromDate()));

            for (LeaveApplication la : sorted) {
                String status = la.getStatus();
                boolean approved = "APPROVED".equalsIgnoreCase(status);
                int days = la.getDays() != null ? la.getDays() : 1;
                boolean isCl = la.getLeaveType() != null && (la.getLeaveType().getName().toUpperCase().contains("CL") || la.getLeaveType().getName().contains("Casual"));

                if (approved) {
                    if (isCl) clBal -= days;
                    else plBal -= days;
                }

                html.append("<tr>");
                html.append("<td>").append(la.getAppliedDate() != null ? la.getAppliedDate().format(dtf) : "-").append("</td>");
                html.append("<td>").append(la.getFromDate() != null ? la.getFromDate().format(dtf) : "").append("</td>");
                html.append("<td>").append(la.getToDate() != null ? la.getToDate().format(dtf) : "").append("</td>");
                html.append("<td>").append(days).append("</td>");
                html.append("<td>").append(isCl ? days : "").append("</td>");
                html.append("<td>").append(!isCl ? days : "").append("</td>");

                if (approved) {
                    html.append("<td>").append(la.getFromDate() != null ? la.getFromDate().format(dtf) : "").append("</td>");
                    html.append("<td>").append(la.getToDate() != null ? la.getToDate().format(dtf) : "").append("</td>");
                    html.append("<td>").append(days).append("</td>");
                    html.append("<td>").append(clBal).append("</td>");
                    html.append("<td>").append(plBal).append("</td>");
                    html.append("<td></td><td></td><td></td><td></td>");
                } else {
                    html.append("<td></td><td></td><td></td>");
                    html.append("<td>").append(clBal).append("</td>");
                    html.append("<td>").append(plBal).append("</td>");
                    html.append("<td>").append(la.getFromDate() != null ? la.getFromDate().format(dtf) : "").append("</td>");
                    html.append("<td>").append(la.getToDate() != null ? la.getToDate().format(dtf) : "").append("</td>");
                    html.append("<td>").append(days).append("</td>");
                    html.append("<td>").append(safeStr(la.getReason())).append("</td>");
                }

                html.append("<td>").append(emp.getFullName()).append("</td>");
                html.append("<td></td><td></td>");
                html.append("</tr>");
            }

            html.append("<tr style='font-weight:bold;background:#f9f9f9'>");
            html.append("<td>Balance</td><td colspan='3'></td>");
            html.append("<td>").append(clBal).append("</td><td>").append(plBal).append("</td>");
            html.append("<td colspan='3'></td>");
            html.append("<td>").append(clBal).append("</td><td>").append(plBal).append("</td>");
            html.append("<td colspan='7'></td>");
            html.append("</tr>");

            html.append("</tbody></table></div>");
        }

        html.append("</body></html>");
        return html.toString();
    }

    public byte[] generateLeaveRegisterExcel(Integer year, String employeeIds) {
        Company company = getCompany();
        List<Employee> employees = employeeRepository.findAllLiveEmployees();

        Set<Long> filterIds = null;
        if (employeeIds != null && !employeeIds.isEmpty()) {
            Set<Long> parsed = new java.util.HashSet<>();
            for (String id : employeeIds.split(",")) {
                try { parsed.add(Long.parseLong(id.trim())); } catch (Exception ignored) {}
            }
            filterIds = parsed;
        }
        final Set<Long> finalFilterIds = filterIds;

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            CellStyle titleStyle = createTitleStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dataStyle = createDataStyle(wb);
            CellStyle empInfoStyle = createEmpInfoStyle(wb);
            CellStyle ruleStyle = createRuleStyle(wb);

            for (Employee emp : employees) {
                if (finalFilterIds != null && !finalFilterIds.contains(emp.getId())) continue;

                // Create a sheet per employee (e.g. PARI001, PARI002...) matching sample
                String sheetName = emp.getEmployeeCode() != null ? emp.getEmployeeCode() : ("Emp_" + emp.getId());
                Sheet sheet = wb.createSheet(sheetName);

                List<LeaveBalance> empBalances = leaveBalanceRepository.findByEmployeeIdAndYear(emp.getId(), year);
                List<LeaveApplication> empApps = leaveApplicationRepository.findByEmployeeIdAndYear(emp.getId(), year);

                int clEntitled = 1, plEntitled = 19;
                for (LeaveBalance lb : empBalances) {
                    if (lb.getLeaveType().getName().toUpperCase().contains("CL") || lb.getLeaveType().getName().contains("Casual")) {
                        clEntitled = lb.getEntitled() != null ? lb.getEntitled() : 1;
                    } else if (lb.getLeaveType().getName().toUpperCase().contains("PL") || lb.getLeaveType().getName().contains("Privilege")) {
                        plEntitled = lb.getEntitled() != null ? lb.getEntitled() : 19;
                    }
                }
                int clBal = clEntitled;
                int plBal = plEntitled;

                int r = 0;
                // Header rows
                createMergedRow(sheet, r++, 19, "Name of the Establishment / Shop : " + company.getCompanyName(), empInfoStyle);
                createMergedRow(sheet, r++, 19, "Address : " + safeStr(company.getAddress()), empInfoStyle);
                createMergedRow(sheet, r++, 19, "Registration No. " + safeStr(company.getRegistrationNumber()), empInfoStyle);
                r++;
                createMergedRow(sheet, r++, 19, "The Andhra Pradesh Shops and Establishments Rules", ruleStyle);
                createMergedRow(sheet, r++, 19, "FORM - XXV", titleStyle);
                createMergedRow(sheet, r++, 19, "REGISTER OF LEAVE", titleStyle);
                createMergedRow(sheet, r++, 19, "See Rule 29(6)", ruleStyle);
                createMergedRow(sheet, r++, 19, "LEAVE WITH WAGES", ruleStyle);
                r++;

                // Employee info
                Row rowEmp1 = sheet.createRow(r++);
                createCell(rowEmp1, 0, "Name of the employee", empInfoStyle);
                createCell(rowEmp1, 1, emp.getFullName(), dataStyle);
                createCell(rowEmp1, 4, "Employee Code", empInfoStyle);
                createCell(rowEmp1, 5, emp.getEmployeeCode(), dataStyle);

                Row rowEmp2 = sheet.createRow(r++);
                createCell(rowEmp2, 0, "Father's/Husband's Name", empInfoStyle);
                createCell(rowEmp2, 1, safeStr(emp.getFatherHusbandName()), dataStyle);
                createCell(rowEmp2, 4, "Designation", empInfoStyle);
                createCell(rowEmp2, 5, safeStr(emp.getDesignation()), dataStyle);

                Row rowEmp3 = sheet.createRow(r++);
                createCell(rowEmp3, 0, "Date of appointment", empInfoStyle);
                createCell(rowEmp3, 1, emp.getDoj() != null ? emp.getDoj().format(dtf) : "-", dataStyle);
                createCell(rowEmp3, 4, "Department", empInfoStyle);
                createCell(rowEmp3, 5, safeStr(emp.getDepartment()), dataStyle);
                r++;

                // Double header rows
                int h1 = r;
                int h2 = r + 1;
                Row rowH1 = sheet.createRow(r++);
                Row rowH2 = sheet.createRow(r++);

                String[] topH = {
                    "Date of", "Applied", "", "No. of", "No. of Days to which\nthe employee is entitled", "",
                    "Leave Granted", "", "No. of Days\nBalance", "", "If refused, in part or full", "", "", "",
                    "Signature of", "", "Date of\nApplication"
                };

                for (int i = 0; i < topH.length; i++) createCell(rowH1, i, topH[i], headerStyle);

                sheet.addMergedRegion(new CellRangeAddress(h1, h1, 1, 2)); // Applied (From, To)
                sheet.addMergedRegion(new CellRangeAddress(h1, h1, 4, 5)); // Entitled (CL, PL)
                sheet.addMergedRegion(new CellRangeAddress(h1, h1, 6, 7)); // Granted (From, To)
                sheet.addMergedRegion(new CellRangeAddress(h1, h1, 8, 9)); // Balance (CL, PL)
                sheet.addMergedRegion(new CellRangeAddress(h1, h1, 10, 13)); // Refused (From, To, Days, Reason)
                sheet.addMergedRegion(new CellRangeAddress(h1, h1, 14, 15)); // Signature (Employee, Employer)

                String[] subH = {
                    "Application", "From", "To", "Days", "CL", "PL",
                    "From", "To", "Days", "CL", "PL",
                    "From", "To", "Days", "Reason",
                    "Employee", "Employer", "Date of Application"
                };
                for (int i = 0; i < subH.length; i++) createCell(rowH2, i, subH[i], headerStyle);

                // Opening balance row
                Row rowOpen = sheet.createRow(r++);
                createCell(rowOpen, 0, "Apr 1, " + year + " opening balance", dataStyle);
                createCell(rowOpen, 1, "", dataStyle);
                createCell(rowOpen, 2, "", dataStyle);
                createCell(rowOpen, 3, "", dataStyle);
                createCell(rowOpen, 4, clEntitled, dataStyle);
                createCell(rowOpen, 5, plEntitled, dataStyle);
                for (int i = 6; i < 18; i++) createCell(rowOpen, i, "", dataStyle);

                // Rows for leave applications
                java.util.List<LeaveApplication> sorted = new java.util.ArrayList<>(empApps);
                sorted.sort(java.util.Comparator.comparing(la -> la.getFromDate()));

                for (LeaveApplication la : sorted) {
                    String status = la.getStatus();
                    boolean approved = "APPROVED".equalsIgnoreCase(status);
                    int days = la.getDays() != null ? la.getDays() : 1;
                    boolean isCl = la.getLeaveType() != null && (la.getLeaveType().getName().toUpperCase().contains("CL") || la.getLeaveType().getName().contains("Casual"));

                    if (approved) {
                        if (isCl) clBal -= days;
                        else plBal -= days;
                    }

                    Row appRow = sheet.createRow(r++);
                    createCell(appRow, 0, la.getAppliedDate() != null ? la.getAppliedDate().format(dtf) : "-", dataStyle);
                    createCell(appRow, 1, la.getFromDate() != null ? la.getFromDate().format(dtf) : "", dataStyle);
                    createCell(appRow, 2, la.getToDate() != null ? la.getToDate().format(dtf) : "", dataStyle);
                    createCell(appRow, 3, days, dataStyle);
                    createCell(appRow, 4, isCl ? days : 0, dataStyle);
                    createCell(appRow, 5, !isCl ? days : 0, dataStyle);

                    if (approved) {
                        createCell(appRow, 6, la.getFromDate() != null ? la.getFromDate().format(dtf) : "", dataStyle);
                        createCell(appRow, 7, la.getToDate() != null ? la.getToDate().format(dtf) : "", dataStyle);
                        createCell(appRow, 8, days, dataStyle);
                        createCell(appRow, 9, clBal, dataStyle);
                        createCell(appRow, 10, plBal, dataStyle);
                        createCell(appRow, 11, "", dataStyle);
                        createCell(appRow, 12, "", dataStyle);
                        createCell(appRow, 13, "", dataStyle);
                        createCell(appRow, 14, "", dataStyle);
                    } else {
                        createCell(appRow, 6, "", dataStyle);
                        createCell(appRow, 7, "", dataStyle);
                        createCell(appRow, 8, 0, dataStyle);
                        createCell(appRow, 9, clBal, dataStyle);
                        createCell(appRow, 10, plBal, dataStyle);
                        createCell(appRow, 11, la.getFromDate() != null ? la.getFromDate().format(dtf) : "", dataStyle);
                        createCell(appRow, 12, la.getToDate() != null ? la.getToDate().format(dtf) : "", dataStyle);
                        createCell(appRow, 13, days, dataStyle);
                        createCell(appRow, 14, safeStr(la.getReason()), dataStyle);
                    }

                    createCell(appRow, 15, emp.getFullName(), dataStyle);
                    createCell(appRow, 16, "", dataStyle);
                    createCell(appRow, 17, "", dataStyle);
                }

                // Balance summary row
                Row balRow = sheet.createRow(r++);
                createCell(balRow, 0, "Balance", titleStyle);
                createCell(balRow, 1, "", dataStyle);
                createCell(balRow, 2, "", dataStyle);
                createCell(balRow, 3, "", dataStyle);
                createCell(balRow, 4, clBal, dataStyle);
                createCell(balRow, 5, plBal, dataStyle);
                createCell(balRow, 6, "", dataStyle);
                createCell(balRow, 7, "", dataStyle);
                createCell(balRow, 8, 0, dataStyle);
                createCell(balRow, 9, clBal, dataStyle);
                createCell(balRow, 10, plBal, dataStyle);
                for (int i = 11; i < 18; i++) createCell(balRow, i, "", dataStyle);

                for (int i = 0; i < 18; i++) sheet.autoSizeColumn(i);
            }

            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error generating Leave Register Excel", e);
            throw new RuntimeException("Failed to generate Excel", e);
        }
    }

    // =========================================================================
    // 4. MONTHLY ATTENDANCE REGISTER (7-Attendance_July'2026.xlsx)
    // =========================================================================

    public String generateAttendanceRegister(Integer year, Integer month) {
        Company company = getCompany();
        String monthName = MONTH_NAMES[month];
        int daysInMonth = YearMonth.of(year, month).lengthOfMonth();
        String regNo = getCompanyRegNo(company);

        List<Employee> employees = employeeRepository.findAllLiveEmployees();
        List<AttendanceRecord> attendanceRecords = attendanceRepository.findByYearAndMonth(year, month);

        if (attendanceRecords.isEmpty()) {
            return "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Attendance Register - " + monthName + " " + year + "</title>"
                + "<style>body{font-family:Arial,sans-serif;background:#f8fafc;padding:40px;margin:0;}</style></head><body>"
                + "<div style='background:#fff; border:1px solid #e2e8f0; box-shadow:0 4px 12px rgba(0,0,0,0.05); padding:36px; border-radius:12px; text-align:center; max-width:620px; margin:40px auto;'>"
                + "<div style='font-size:38px; margin-bottom:12px;'>📋</div>"
                + "<h2 style='margin:0 0 10px 0; color:#1e293b; font-size:20px; font-weight:700;'>Attendance Not Recorded</h2>"
                + "<p style='margin:0 0 14px 0; font-size:13.5px; color:#475569; line-height:1.5;'>"
                + "No attendance records were found for <strong>" + monthName + " " + year + "</strong> in the system."
                + "</p>"
                + "<div style='background:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:12px 16px; margin-top:16px; font-size:12px; color:#92400e; text-align:left; line-height:1.5;'>"
                + "<strong>Note:</strong> Statutory reports are generated strictly based on recorded attendance. Please record or import daily attendance for this month under <em>Leave & Attendance &gt; Attendance</em> to generate this muster roll."
                + "</div>"
                + "</div></body></html>";
        }

        // Map employeeId -> (Day -> Status)
        Map<Long, Map<Integer, String>> attMap = new HashMap<>();
        for (AttendanceRecord ar : attendanceRecords) {
            if (ar.getEmployee() != null && ar.getAttendanceDate() != null) {
                attMap.computeIfAbsent(ar.getEmployee().getId(), k -> new HashMap<>())
                    .put(ar.getAttendanceDate().getDayOfMonth(), ar.getStatus());
            }
        }

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body{font-family:Arial,sans-serif;margin:10px;font-size:11px;}");
        html.append("h2{text-align:center;margin:4px 0;font-size:15px;font-weight:bold;}");
        html.append(".info{margin:3px 0;font-size:11px;}");
        html.append("table{width:100%;border-collapse:collapse;margin-top:8px;}");
        html.append("th,td{border:1px solid #000;padding:3px 2px;text-align:center;font-size:9px;white-space:nowrap;}");
        html.append("th{background:#f0f4ff;font-weight:bold;}");
        html.append(".p{color:#059669;font-weight:bold;}");
        html.append(".a{color:#dc2626;font-weight:bold;}");
        html.append(".l{color:#2563eb;font-weight:bold;}");
        html.append(".h{color:#7c3aed;font-weight:bold;}");
        html.append(".wo{color:#6b7280;}");
        html.append(".blank{color:#cbd5e1;}");
        html.append("</style></head><body>");

        html.append("<h2>Attendance Register - ").append(monthName).append(" ").append(year).append("</h2>");
        html.append("<div class='info'><b>Name of the Establishment :</b> ").append(company.getCompanyName()).append("</div>");
        html.append("<div class='info'><b>Address :</b> ").append(company.getAddress()).append(" | <b>Registration No :</b> ").append(regNo).append("</div>");

        html.append("<table><thead><tr>");
        html.append("<th>S No</th><th>Gender</th><th>EmpCode</th><th>Employee Name</th><th>Department</th><th>DOJ</th><th>Vintage</th>");
        for (int d = 1; d <= daysInMonth; d++) {
            html.append("<th>").append(d).append("</th>");
        }
        html.append("<th>Total Present</th><th>Leaves</th><th>Absent</th><th>Total Payable</th><th>Exit Status</th>");
        html.append("</tr></thead><tbody>");

        int sl = 1;
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yy");
        LocalDate now = LocalDate.of(year, month, 1);

        for (Employee emp : employees) {
            Map<Integer, String> empDays = attMap.getOrDefault(emp.getId(), Collections.emptyMap());
            int pCount = 0, lCount = 0, aCount = 0;

            long vintageMonths = 0;
            if (emp.getDoj() != null) {
                vintageMonths = ChronoUnit.MONTHS.between(emp.getDoj(), now);
                if (vintageMonths < 0) vintageMonths = 0;
            }

            html.append("<tr>");
            html.append("<td>").append(sl++).append("</td>");
            html.append("<td>").append(emp.getGender() != null ? (emp.getGender().toUpperCase().startsWith("M") ? "M" : "F") : "-").append("</td>");
            html.append("<td>").append(emp.getEmployeeCode()).append("</td>");
            html.append("<td style='text-align:left'>").append(emp.getFullName()).append("</td>");
            html.append("<td>").append(safeStr(emp.getDepartment() != null ? emp.getDepartment() : emp.getProcessAssigned())).append("</td>");
            html.append("<td>").append(emp.getDoj() != null ? emp.getDoj().format(dtf) : "-").append("</td>");
            html.append("<td>").append(vintageMonths).append("</td>");

            for (int d = 1; d <= daysInMonth; d++) {
                String st = empDays.get(d);
                if (st == null || st.trim().isEmpty()) {
                    st = "—";
                }
                String cls = "—".equals(st) ? "blank" : st.toLowerCase();
                if ("P".equalsIgnoreCase(st)) pCount++;
                else if ("L".equalsIgnoreCase(st) || "CL".equalsIgnoreCase(st) || "PL".equalsIgnoreCase(st) || "SL".equalsIgnoreCase(st) || "ML".equalsIgnoreCase(st)) lCount++;
                else if ("A".equalsIgnoreCase(st)) aCount++;

                html.append("<td class='").append(cls).append("'>").append(st).append("</td>");
            }

            int payableDays = pCount + lCount;
            html.append("<td><b>").append(pCount).append("</b></td>");
            html.append("<td>").append(lCount).append("</td>");
            html.append("<td>").append(aCount).append("</td>");
            html.append("<td><b>").append(payableDays).append("</b></td>");
            html.append("<td>").append(emp.getEmployeeStatus() != null ? emp.getEmployeeStatus() : "LIVE").append("</td>");
            html.append("</tr>");
        }

        html.append("</tbody></table></body></html>");
        return html.toString();
    }

    public byte[] generateAttendanceRegisterExcel(Integer year, Integer month) {
        Company company = getCompany();
        String monthName = MONTH_NAMES[month];
        int daysInMonth = YearMonth.of(year, month).lengthOfMonth();

        List<Employee> employees = employeeRepository.findAllLiveEmployees();
        List<AttendanceRecord> attendanceRecords = attendanceRepository.findByYearAndMonth(year, month);

        Map<Long, Map<Integer, String>> attMap = new HashMap<>();
        for (AttendanceRecord ar : attendanceRecords) {
            if (ar.getEmployee() != null && ar.getAttendanceDate() != null) {
                attMap.computeIfAbsent(ar.getEmployee().getId(), k -> new HashMap<>())
                    .put(ar.getAttendanceDate().getDayOfMonth(), ar.getStatus());
            }
        }

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Attendance " + monthName + "'" + year);
            CellStyle titleStyle = createTitleStyle(wb);
            CellStyle infoStyle = createInfoStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dataStyle = createDataStyle(wb);

            int r = 0;
            // Title and summary metadata
            createMergedRow(sheet, r++, daysInMonth + 12, "Name of the Establishment : " + company.getCompanyName(), infoStyle);
            createMergedRow(sheet, r++, daysInMonth + 12, "Attendance " + monthName + "'" + year, titleStyle);

            if (attendanceRecords.isEmpty()) {
                createMergedRow(sheet, r++, daysInMonth + 12, "Notice: No attendance records found for " + monthName + " " + year + " in the database.", infoStyle);
                wb.write(out);
                return out.toByteArray();
            }

            r++;

            // Header row
            Row hRow = sheet.createRow(r++);
            int c = 0;
            createCell(hRow, c++, "S No", headerStyle);
            createCell(hRow, c++, "Gender", headerStyle);
            createCell(hRow, c++, "EmpCode", headerStyle);
            createCell(hRow, c++, "Employee Name", headerStyle);
            createCell(hRow, c++, "Department", headerStyle);
            createCell(hRow, c++, "Date of Joining", headerStyle);
            createCell(hRow, c++, "Vintage", headerStyle);

            for (int d = 1; d <= daysInMonth; d++) {
                LocalDate date = LocalDate.of(year, month, d);
                String dayName = date.getDayOfWeek().name().substring(0, 3);
                createCell(hRow, c++, d + "\n" + dayName, headerStyle);
            }

            createCell(hRow, c++, "Total Present", headerStyle);
            createCell(hRow, c++, "Leaves", headerStyle);
            createCell(hRow, c++, "Total Absent", headerStyle);
            createCell(hRow, c++, "Total Payable", headerStyle);
            createCell(hRow, c++, "Exit Status", headerStyle);

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            LocalDate now = LocalDate.of(year, month, 1);
            int sl = 1;

            for (Employee emp : employees) {
                Map<Integer, String> empDays = attMap.getOrDefault(emp.getId(), Collections.emptyMap());
                int pCount = 0, lCount = 0, aCount = 0;

                long vintageMonths = 0;
                if (emp.getDoj() != null) {
                    vintageMonths = ChronoUnit.MONTHS.between(emp.getDoj(), now);
                    if (vintageMonths < 0) vintageMonths = 0;
                }

                Row row = sheet.createRow(r++);
                int rc = 0;
                createCell(row, rc++, sl++, dataStyle);
                createCell(row, rc++, emp.getGender() != null ? (emp.getGender().toUpperCase().startsWith("M") ? "M" : "F") : "-", dataStyle);
                createCell(row, rc++, emp.getEmployeeCode(), dataStyle);
                createCell(row, rc++, emp.getFullName(), dataStyle);
                createCell(row, rc++, safeStr(emp.getDepartment() != null ? emp.getDepartment() : emp.getProcessAssigned()), dataStyle);
                createCell(row, rc++, emp.getDoj() != null ? emp.getDoj().format(dtf) : "-", dataStyle);
                createCell(row, rc++, (int) vintageMonths, dataStyle);

                for (int d = 1; d <= daysInMonth; d++) {
                    String st = empDays.get(d);
                    if (st == null || st.trim().isEmpty()) {
                        st = "—";
                    }
                    if ("P".equalsIgnoreCase(st)) pCount++;
                    else if ("L".equalsIgnoreCase(st) || "CL".equalsIgnoreCase(st) || "PL".equalsIgnoreCase(st) || "SL".equalsIgnoreCase(st) || "ML".equalsIgnoreCase(st)) lCount++;
                    else if ("A".equalsIgnoreCase(st)) aCount++;

                    createCell(row, rc++, st, dataStyle);
                }

                createCell(row, rc++, pCount, dataStyle);
                createCell(row, rc++, lCount, dataStyle);
                createCell(row, rc++, aCount, dataStyle);
                createCell(row, rc++, pCount + lCount, dataStyle);
                createCell(row, rc++, emp.getEmployeeStatus() != null ? emp.getEmployeeStatus() : "LIVE", dataStyle);
            }

            for (int i = 0; i < c; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error generating Attendance Register Excel", e);
            throw new RuntimeException("Failed to generate Excel", e);
        }
    }

    // =========================================================================
    // EXCEL STYLING HELPERS
    // =========================================================================

    private CellStyle createTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 13);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createInfoStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
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
        style.setAlignment(HorizontalAlignment.CENTER);
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

    private void createTitleRow(Sheet sheet, int rowNum, int cols, String title, CellStyle style) {
        Row row = sheet.createRow(rowNum);
        createCell(row, 0, title, style);
        if (cols > 1) sheet.addMergedRegion(new CellRangeAddress(rowNum, rowNum, 0, cols - 1));
    }

    private int createInfoRow(Sheet sheet, int rowNum, String label, String value, CellStyle style, int cols) {
        Row row = sheet.createRow(rowNum);
        createCell(row, 0, label + " : " + value, style);
        if (cols > 1) sheet.addMergedRegion(new CellRangeAddress(rowNum, rowNum, 0, cols - 1));
        return rowNum + 1;
    }

    private void createHeaderRow(Sheet sheet, int rowNum, String[] headers, CellStyle style) {
        Row row = sheet.createRow(rowNum);
        for (int i = 0; i < headers.length; i++) {
            createCell(row, i, headers[i], style);
        }
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

    private void createCell(Row row, int col, double value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private void createCell(Row row, int col, BigDecimal value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value.doubleValue() : 0.0);
        cell.setCellStyle(style);
    }

    private BigDecimal safeD(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    private String safeStr(String val) {
        return val != null && !val.trim().isEmpty() ? val : "-";
    }

    private void createMergedRow(Sheet sheet, int rowNum, int totalCols, String value, CellStyle style) {
        Row row = sheet.createRow(rowNum);
        createCell(row, 0, value, style);
        if (totalCols > 1) {
            sheet.addMergedRegion(new CellRangeAddress(rowNum, rowNum, 0, totalCols - 1));
        }
    }

    private CellStyle createEmpInfoStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        return style;
    }

    private CellStyle createRuleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private BigDecimal safe(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    private String fmt(BigDecimal val) {
        if (val == null) return "0.00";
        return String.format("%,.2f", val);
    }
}
