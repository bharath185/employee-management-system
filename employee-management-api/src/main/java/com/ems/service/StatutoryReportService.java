package com.ems.service;

import com.ems.model.Company;
import com.ems.model.Salary;
import com.ems.model.LeaveType;
import com.ems.model.LeaveBalance;
import com.ems.repository.CompanyRepository;
import com.ems.repository.SalaryRepository;
import com.ems.repository.LeaveTypeRepository;
import com.ems.repository.LeaveBalanceRepository;
import com.ems.repository.LeaveApplicationRepository;
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
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatutoryReportService {

    private final SalaryRepository salaryRepository;
    private final LeaveApplicationRepository leaveApplicationRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final CompanyRepository companyRepository;

    private static final String[] MONTH_NAMES = {
        "", "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    };

    private Company getCompany() {
        return companyRepository.findAll().stream().findFirst()
            .orElse(Company.builder()
                .companyName("PARIKAR BUSINESS & KNOWLEDGE SERVICES PRIVATE LIMITED")
                .address("Ecco Green, Upadhyayanagar Grand World, Tirupathi - 517501")
                .registrationNumber("AP-10-11-001-02218597")
                .build());
    }

    public String generateIndividualWorkerDetails(Integer year, Integer month) {
        Company company = getCompany();
        List<Salary> salaries = salaryRepository.findByWageYearAndWageMonth(year, month);
        String monthName = MONTH_NAMES[month];

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body{font-family:Arial,sans-serif;margin:20px;font-size:12px;}");
        html.append("h2{text-align:center;margin:5px 0;font-size:14px;}");
        html.append("table{width:100%;border-collapse:collapse;margin-top:10px;}");
        html.append("th,td{border:1px solid #000;padding:6px 8px;text-align:center;font-size:11px;}");
        html.append("th{background:#f0f0f0;font-weight:bold;}");
        html.append(".info{margin:8px 0;font-size:12px;}");
        html.append("@media print{body{margin:10px;}}");
        html.append("</style></head><body>");

        html.append("<h2>Individual Worker Details</h2>");
        html.append("<div class='info'><b>Name of the Establishment :</b> ").append(company.getCompanyName()).append("</div>");
        html.append("<div class='info'><b>Address :</b> ").append(company.getAddress()).append("</div>");
        html.append("<div class='info'><b>Registration No -</b> ").append(company.getRegistrationNumber()).append("</div>");
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
            html.append("<td>-</td>");
            html.append("<td>").append(s.getWeeklyOff() != null ? s.getWeeklyOff() : "Allowed").append("</td>");
            html.append("<td>M</td>");
            html.append("<td>").append(s.getWorkerType() != null ? s.getWorkerType() : "Permanent").append("</td>");
            html.append("</tr>");
        }

        html.append("</tbody></table></body></html>");
        return html.toString();
    }

    public String generateWagesRegister(Integer year, Integer month) {
        Company company = getCompany();
        List<Salary> salaries = salaryRepository.findByWageYearAndWageMonth(year, month);
        String monthName = MONTH_NAMES[month];

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body{font-family:Arial,sans-serif;margin:20px;font-size:12px;}");
        html.append("h2{text-align:center;margin:5px 0;font-size:14px;}");
        html.append("table{width:100%;border-collapse:collapse;margin-top:10px;}");
        html.append("th,td{border:1px solid #000;padding:4px 6px;text-align:center;font-size:10px;white-space:nowrap;}");
        html.append("th{background:#f0f0f0;font-weight:bold;}");
        html.append(".info{margin:8px 0;font-size:12px;}");
        html.append("@media print{body{margin:10px;}}");
        html.append("</style></head><body>");

        html.append("<h2>Wages Register</h2>");
        html.append("<div class='info'><b>Name of the Establishment :</b> ").append(company.getCompanyName()).append("</div>");
        html.append("<div class='info'><b>Address :</b> ").append(company.getAddress()).append("</div>");
        html.append("<div class='info'><b>Registration No -</b> ").append(company.getRegistrationNumber()).append("</div>");
        html.append("<div class='info'><b>Wages period -</b> ").append(monthName).append(", ").append(year).append("</div>");

        html.append("<table><thead><tr>");
        html.append("<th rowspan='2'>Sl.No</th><th rowspan='2'>Name of the Employee</th>");
        html.append("<th rowspan='2'>Employee Code</th><th rowspan='2'>Date of Appointment</th>");
        html.append("<th colspan='5'>Rate of wages</th>");
        html.append("<th colspan='5'>Normal wages earned</th>");
        html.append("<th rowspan='2'>Wages Earned for Overtime Work</th>");
        html.append("<th rowspan='2'>Gross Wages Payable</th>");
        html.append("<th colspan='3'>Deductions</th>");
        html.append("<th rowspan='2'>Actual Wages Paid</th>");
        html.append("<th rowspan='2'>Date of Payment</th>");
        html.append("<th rowspan='2'>Signature or thumb impression of the employee</th>");
        html.append("</tr><tr>");
        html.append("<th>Basic</th><th>HRA</th><th>Fixed Personal Allow</th><th>Oth. Allowance</th><th>Gross Salary</th>");
        html.append("<th>Basic</th><th>HRA</th><th>Fixed Personal Allow</th><th>Oth. Allowance</th><th>Gross Salary</th>");
        html.append("<th>PF</th><th>ESI</th><th>PT</th>");
        html.append("</tr></thead><tbody>");

        int sl = 1;
        java.math.BigDecimal totalBasic = java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalHra = java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalFpa = java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalOther = java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalGross = java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalPf = java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalEsi = java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalPt = java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalOt = java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalNet = java.math.BigDecimal.ZERO;

        for (Salary s : salaries) {
            totalBasic = totalBasic.add(safe(s.getBasic()));
            totalHra = totalHra.add(safe(s.getHra()));
            totalFpa = totalFpa.add(safe(s.getFixedPersonalAllowance()));
            totalOther = totalOther.add(safe(s.getOtherAllowance()));
            totalGross = totalGross.add(safe(s.getGrossSalary()));
            totalPf = totalPf.add(safe(s.getPfDeduction()));
            totalEsi = totalEsi.add(safe(s.getEsiDeduction()));
            totalPt = totalPt.add(safe(s.getPtDeduction()));
            totalOt = totalOt.add(safe(s.getOvertimeWages()));
            totalNet = totalNet.add(safe(s.getNetPay()));

            html.append("<tr>");
            html.append("<td>").append(sl++).append("</td>");
            html.append("<td style='text-align:left'>").append(s.getEmployee().getFullName()).append("</td>");
            html.append("<td>").append(s.getEmployee().getEmployeeCode()).append("</td>");
            html.append("<td>").append(s.getEmployee().getDoj() != null ? s.getEmployee().getDoj().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "-").append("</td>");
            html.append("<td>").append(fmt(s.getBasic())).append("</td>");
            html.append("<td>").append(fmt(s.getHra())).append("</td>");
            html.append("<td>").append(fmt(s.getFixedPersonalAllowance())).append("</td>");
            html.append("<td>").append(fmt(s.getOtherAllowance())).append("</td>");
            html.append("<td>").append(fmt(s.getGrossSalary())).append("</td>");
            html.append("<td>").append(fmt(s.getBasic())).append("</td>");
            html.append("<td>").append(fmt(s.getHra())).append("</td>");
            html.append("<td>").append(fmt(s.getFixedPersonalAllowance())).append("</td>");
            html.append("<td>").append(fmt(s.getOtherAllowance())).append("</td>");
            html.append("<td>").append(fmt(s.getGrossSalary())).append("</td>");
            html.append("<td>").append(fmt(s.getOvertimeWages())).append("</td>");
            html.append("<td>").append(fmt(s.getGrossSalary())).append("</td>");
            html.append("<td>").append(fmt(s.getPfDeduction())).append("</td>");
            html.append("<td>").append(fmt(s.getEsiDeduction())).append("</td>");
            html.append("<td>").append(fmt(s.getPtDeduction())).append("</td>");
            html.append("<td>").append(fmt(s.getNetPay())).append("</td>");
            html.append("<td>").append(s.getDateOfPayment() != null ? s.getDateOfPayment().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "-").append("</td>");
            html.append("<td></td>");
            html.append("</tr>");
        }

        html.append("<tr style='font-weight:bold;background:#f9f9f9'>");
        html.append("<td colspan='4'>Total</td>");
        html.append("<td>").append(fmt(totalBasic)).append("</td>");
        html.append("<td>").append(fmt(totalHra)).append("</td>");
        html.append("<td>").append(fmt(totalFpa)).append("</td>");
        html.append("<td>").append(fmt(totalOther)).append("</td>");
        html.append("<td>").append(fmt(totalGross)).append("</td>");
        html.append("<td>").append(fmt(totalBasic)).append("</td>");
        html.append("<td>").append(fmt(totalHra)).append("</td>");
        html.append("<td>").append(fmt(totalFpa)).append("</td>");
        html.append("<td>").append(fmt(totalOther)).append("</td>");
        html.append("<td>").append(fmt(totalGross)).append("</td>");
        html.append("<td>").append(fmt(totalOt)).append("</td>");
        html.append("<td>").append(fmt(totalGross)).append("</td>");
        html.append("<td>").append(fmt(totalPf)).append("</td>");
        html.append("<td>").append(fmt(totalEsi)).append("</td>");
        html.append("<td>").append(fmt(totalPt)).append("</td>");
        html.append("<td>").append(fmt(totalNet)).append("</td>");
        html.append("<td colspan='2'></td>");
        html.append("</tr>");

        html.append("</tbody></table></body></html>");
        return html.toString();
    }

    public String generateLeaveRegister(Integer year) {
        Company company = getCompany();
        List<LeaveType> leaveTypes = leaveTypeRepository.findByIsActiveTrue();
        List<LeaveBalance> balances = leaveBalanceRepository.findByYear(year);

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body{font-family:Arial,sans-serif;margin:20px;font-size:12px;}");
        html.append("h2{text-align:center;margin:5px 0;font-size:14px;}");
        html.append("h3{text-align:center;margin:5px 0;font-size:12px;}");
        html.append("table{width:100%;border-collapse:collapse;margin-top:10px;}");
        html.append("th,td{border:1px solid #000;padding:5px 6px;text-align:center;font-size:11px;}");
        html.append("th{background:#f0f0f0;font-weight:bold;}");
        html.append(".info{margin:8px 0;font-size:12px;}");
        html.append("@media print{body{margin:10px;}}");
        html.append("</style></head><body>");

        html.append("<h2>The Andhra Pradesh Shops and Establishments Rules</h2>");
        html.append("<h3>FORM - XXV</h3>");
        html.append("<h3>REGISTER OF LEAVE</h3>");
        html.append("<p style='font-size:11px;text-align:center'>See Rule 29(6)</p>");
        html.append("<div class='info'><b>Name of the Establishment /Shop :</b> ").append(company.getCompanyName()).append("</div>");
        html.append("<div class='info'><b>Address :</b> ").append(company.getAddress()).append("</div>");
        html.append("<div class='info'><b>Registration No -</b> ").append(company.getRegistrationNumber()).append("</div>");
        html.append("<div class='info'><b>LEAVE WITH WAGES</b></div>");

        html.append("<table><thead><tr>");
        html.append("<th>Name of the Employee</th><th>Employee Code</th>");
        for (LeaveType lt : leaveTypes) {
            html.append("<th>").append(lt.getName()).append(" - Entitled</th>");
            html.append("<th>").append(lt.getName()).append(" - Taken</th>");
            html.append("<th>").append(lt.getName()).append(" - Balance</th>");
        }
        html.append("</tr></thead><tbody>");

        Map<Long, List<LeaveBalance>> grouped = balances.stream()
            .collect(Collectors.groupingBy(lb -> lb.getEmployee().getId()));

        for (Map.Entry<Long, List<LeaveBalance>> entry : grouped.entrySet()) {
            List<LeaveBalance> empBalances = entry.getValue();
            if (empBalances.isEmpty()) continue;

            LeaveBalance first = empBalances.get(0);
            html.append("<tr>");
            html.append("<td style='text-align:left'>").append(first.getEmployee().getFullName()).append("</td>");
            html.append("<td>").append(first.getEmployee().getEmployeeCode()).append("</td>");

            for (LeaveType lt : leaveTypes) {
                LeaveBalance lb = empBalances.stream()
                    .filter(b -> b.getLeaveType().getId().equals(lt.getId()))
                    .findFirst().orElse(null);
                if (lb != null) {
                    html.append("<td>").append(lb.getEntitled()).append("</td>");
                    html.append("<td>").append(lb.getTaken()).append("</td>");
                    html.append("<td>").append(lb.getBalance()).append("</td>");
                } else {
                    html.append("<td>-</td><td>-</td><td>-</td>");
                }
            }
            html.append("</tr>");
        }

        html.append("</tbody></table></body></html>");
        return html.toString();
    }

    // ========== EXCEL GENERATION ==========

    public byte[] generateIndividualWorkerDetailsExcel(Integer year, Integer month) {
        Company company = getCompany();
        List<Salary> salaries = salaryRepository.findByWageYearAndWageMonth(year, month);
        String monthName = MONTH_NAMES[month];

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Individual Worker Details");
            CellStyle titleStyle = createTitleStyle(wb);
            CellStyle infoStyle = createInfoStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dataStyle = createDataStyle(wb);
            CellStyle currencyStyle = createCurrencyStyle(wb);

            int r = 0;
            createTitleRow(sheet, r++, 12, "Individual Worker Details", titleStyle);
            r = createInfoRow(sheet, r, "Name of the Establishment", company.getCompanyName(), infoStyle, 12);
            r = createInfoRow(sheet, r, "Address", safeStr(company.getAddress()), infoStyle, 12);
            r = createInfoRow(sheet, r, "Registration No", safeStr(company.getRegistrationNumber()), infoStyle, 12);
            r = createInfoRow(sheet, r, "Wages period", monthName + ", " + year, infoStyle, 12);
            r++;

            String[] headers = {"Sl.No", "Name of the Employee", "Employee Code", "Designation", "Gender",
                "Working Since", "Wages as per Scheduled Employment", "Actual wages Paid",
                "No of Working Hours per Day", "OT Wages paid", "Weekly Off", "Wages Paid(D/W/M)", "Worker Type"};
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
                createCell(row, 9, "-", dataStyle);
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

    public byte[] generateWagesRegisterExcel(Integer year, Integer month) {
        Company company = getCompany();
        List<Salary> salaries = salaryRepository.findByWageYearAndWageMonth(year, month);
        String monthName = MONTH_NAMES[month];

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Wages Register");
            CellStyle titleStyle = createTitleStyle(wb);
            CellStyle infoStyle = createInfoStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dataStyle = createDataStyle(wb);
            CellStyle currencyStyle = createCurrencyStyle(wb);
            CellStyle totalStyle = createTotalStyle(wb);

            int r = 0;
            createTitleRow(sheet, r++, 18, "Wages Register", titleStyle);
            r = createInfoRow(sheet, r, "Name of the Establishment", company.getCompanyName(), infoStyle, 18);
            r = createInfoRow(sheet, r, "Address", safeStr(company.getAddress()), infoStyle, 18);
            r = createInfoRow(sheet, r, "Registration No", safeStr(company.getRegistrationNumber()), infoStyle, 18);
            r = createInfoRow(sheet, r, "Wages period", monthName + ", " + year, infoStyle, 18);
            r++;

            // Row 1 headers
            String[] topHeaders = {"Sl.No", "Name of the Employee", "Employee Code", "Date of Appointment",
                "Rate of wages", "", "", "", "",
                "Normal wages earned", "", "", "", "",
                "OT Wages", "Gross Wages", "Deductions", "", "", "Actual Wages Paid", "Date of Payment", "Signature"};
            Row topRow = sheet.createRow(r);
            for (int i = 0; i < topHeaders.length; i++) createCell(topRow, i, topHeaders[i], headerStyle);
            sheet.addMergedRegion(new CellRangeAddress(r, r, 4, 8));
            sheet.addMergedRegion(new CellRangeAddress(r, r, 9, 13));
            sheet.addMergedRegion(new CellRangeAddress(r, r, 16, 18));
            r++;

            String[] subHeaders = {"", "", "", "", "Basic", "HRA", "FPA", "Oth.Allow", "Gross",
                "Basic", "HRA", "FPA", "Oth.Allow", "Gross",
                "", "", "PF", "ESI", "PT", "", "", ""};
            Row subRow = sheet.createRow(r);
            for (int i = 0; i < subHeaders.length; i++) createCell(subRow, i, subHeaders[i], headerStyle);
            r++;

            BigDecimal tBasic = BigDecimal.ZERO, tHra = BigDecimal.ZERO, tFpa = BigDecimal.ZERO;
            BigDecimal tOther = BigDecimal.ZERO, tGross = BigDecimal.ZERO;
            BigDecimal tPf = BigDecimal.ZERO, tEsi = BigDecimal.ZERO, tPt = BigDecimal.ZERO;
            BigDecimal tOt = BigDecimal.ZERO, tNet = BigDecimal.ZERO;

            int sl = 1;
            for (Salary s : salaries) {
                Row row = sheet.createRow(r++);
                createCell(row, 0, sl++, dataStyle);
                createCell(row, 1, safeStr(s.getEmployee().getFullName()), dataStyle);
                createCell(row, 2, safeStr(s.getEmployee().getEmployeeCode()), dataStyle);
                createCell(row, 3, s.getEmployee().getDoj() != null ? s.getEmployee().getDoj().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "-", dataStyle);
                createCell(row, 4, s.getBasic(), currencyStyle);
                createCell(row, 5, s.getHra(), currencyStyle);
                createCell(row, 6, s.getFixedPersonalAllowance(), currencyStyle);
                createCell(row, 7, s.getOtherAllowance(), currencyStyle);
                createCell(row, 8, s.getGrossSalary(), currencyStyle);
                createCell(row, 9, s.getBasic(), currencyStyle);
                createCell(row, 10, s.getHra(), currencyStyle);
                createCell(row, 11, s.getFixedPersonalAllowance(), currencyStyle);
                createCell(row, 12, s.getOtherAllowance(), currencyStyle);
                createCell(row, 13, s.getGrossSalary(), currencyStyle);
                createCell(row, 14, s.getOvertimeWages(), currencyStyle);
                createCell(row, 15, s.getGrossSalary(), currencyStyle);
                createCell(row, 16, s.getPfDeduction(), currencyStyle);
                createCell(row, 17, s.getEsiDeduction(), currencyStyle);
                createCell(row, 18, s.getPtDeduction(), currencyStyle);
                createCell(row, 19, s.getNetPay(), currencyStyle);
                createCell(row, 20, s.getDateOfPayment() != null ? s.getDateOfPayment().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "-", dataStyle);
                createCell(row, 21, "", dataStyle);

                tBasic = tBasic.add(safeD(s.getBasic()));
                tHra = tHra.add(safeD(s.getHra()));
                tFpa = tFpa.add(safeD(s.getFixedPersonalAllowance()));
                tOther = tOther.add(safeD(s.getOtherAllowance()));
                tGross = tGross.add(safeD(s.getGrossSalary()));
                tPf = tPf.add(safeD(s.getPfDeduction()));
                tEsi = tEsi.add(safeD(s.getEsiDeduction()));
                tPt = tPt.add(safeD(s.getPtDeduction()));
                tOt = tOt.add(safeD(s.getOvertimeWages()));
                tNet = tNet.add(safeD(s.getNetPay()));
            }

            Row totalRow = sheet.createRow(r++);
            createCell(totalRow, 0, "Total", totalStyle);
            for (int i = 1; i < 4; i++) createCell(totalRow, i, "", totalStyle);
            createCell(totalRow, 4, tBasic, totalStyle);
            createCell(totalRow, 5, tHra, totalStyle);
            createCell(totalRow, 6, tFpa, totalStyle);
            createCell(totalRow, 7, tOther, totalStyle);
            createCell(totalRow, 8, tGross, totalStyle);
            createCell(totalRow, 9, tBasic, totalStyle);
            createCell(totalRow, 10, tHra, totalStyle);
            createCell(totalRow, 11, tFpa, totalStyle);
            createCell(totalRow, 12, tOther, totalStyle);
            createCell(totalRow, 13, tGross, totalStyle);
            createCell(totalRow, 14, tOt, totalStyle);
            createCell(totalRow, 15, tGross, totalStyle);
            createCell(totalRow, 16, tPf, totalStyle);
            createCell(totalRow, 17, tEsi, totalStyle);
            createCell(totalRow, 18, tPt, totalStyle);
            createCell(totalRow, 19, tNet, totalStyle);
            createCell(totalRow, 20, "", totalStyle);
            createCell(totalRow, 21, "", totalStyle);

            for (int i = 0; i < 22; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error generating Wages Register Excel", e);
            throw new RuntimeException("Failed to generate Excel", e);
        }
    }

    public byte[] generateLeaveRegisterExcel(Integer year) {
        Company company = getCompany();
        List<LeaveType> leaveTypes = leaveTypeRepository.findByIsActiveTrue();
        List<LeaveBalance> balances = leaveBalanceRepository.findByYear(year);

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Leave Register");
            CellStyle titleStyle = createTitleStyle(wb);
            CellStyle infoStyle = createInfoStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dataStyle = createDataStyle(wb);

            int cols = 2 + leaveTypes.size() * 3;
            int r = 0;
            createTitleRow(sheet, r++, cols, "FORM - XXV  REGISTER OF LEAVE", titleStyle);
            r = createInfoRow(sheet, r, "Name of the Establishment", company.getCompanyName(), infoStyle, cols);
            r = createInfoRow(sheet, r, "Address", safeStr(company.getAddress()), infoStyle, cols);
            r = createInfoRow(sheet, r, "Registration No", safeStr(company.getRegistrationNumber()), infoStyle, cols);
            r++;

            String[] headers = new String[cols];
            headers[0] = "Name of the Employee";
            headers[1] = "Employee Code";
            int idx = 2;
            for (LeaveType lt : leaveTypes) {
                headers[idx++] = lt.getName() + " - Entitled";
                headers[idx++] = lt.getName() + " - Taken";
                headers[idx++] = lt.getName() + " - Balance";
            }
            createHeaderRow(sheet, r, headers, headerStyle);
            r++;

            Map<Long, List<LeaveBalance>> grouped = balances.stream()
                .collect(Collectors.groupingBy(lb -> lb.getEmployee().getId()));

            for (Map.Entry<Long, List<LeaveBalance>> entry : grouped.entrySet()) {
                List<LeaveBalance> empBalances = entry.getValue();
                if (empBalances.isEmpty()) continue;
                LeaveBalance first = empBalances.get(0);

                Row row = sheet.createRow(r++);
                createCell(row, 0, safeStr(first.getEmployee().getFullName()), dataStyle);
                createCell(row, 1, safeStr(first.getEmployee().getEmployeeCode()), dataStyle);
                idx = 2;
                for (LeaveType lt : leaveTypes) {
                    LeaveBalance lb = empBalances.stream()
                        .filter(b -> b.getLeaveType().getId().equals(lt.getId()))
                        .findFirst().orElse(null);
                    if (lb != null) {
                        createCell(row, idx++, lb.getEntitled(), dataStyle);
                        createCell(row, idx++, lb.getTaken(), dataStyle);
                        createCell(row, idx++, lb.getBalance(), dataStyle);
                    } else {
                        createCell(row, idx++, "-", dataStyle);
                        createCell(row, idx++, "-", dataStyle);
                        createCell(row, idx++, "-", dataStyle);
                    }
                }
            }

            for (int i = 0; i < cols; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error generating Leave Register Excel", e);
            throw new RuntimeException("Failed to generate Excel", e);
        }
    }

    // ========== EXCEL STYLING HELPERS ==========

    private CellStyle createTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
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
        style.setDataFormat(wb.createDataFormat().getFormat("#,##0.00"));
        return style;
    }

    private void createTitleRow(Sheet sheet, int rowNum, int cols, String title, CellStyle style) {
        Row row = sheet.createRow(rowNum);
        createCell(row, 0, title, style);
        sheet.addMergedRegion(new CellRangeAddress(rowNum, rowNum, 0, cols - 1));
    }

    private int createInfoRow(Sheet sheet, int rowNum, String label, String value, CellStyle style, int cols) {
        Row row = sheet.createRow(rowNum);
        createCell(row, 0, label + " : " + value, style);
        sheet.addMergedRegion(new CellRangeAddress(rowNum, rowNum, 0, cols - 1));
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
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private void createCell(Row row, int col, int value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private void createCell(Row row, int col, BigDecimal value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value.doubleValue());
        cell.setCellStyle(style);
    }

    private BigDecimal safeD(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    private String safeStr(String val) {
        return val != null && !val.isEmpty() ? val : "-";
    }

    private BigDecimal safe(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    private String fmt(BigDecimal val) {
        if (val == null) return "0.00";
        return String.format("%,.2f", val);
    }
}
