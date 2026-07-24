package com.ems.service;

import com.ems.model.Company;
import com.ems.model.Salary;
import com.ems.model.LeaveType;
import com.ems.model.LeaveBalance;
import com.ems.model.LeaveApplication;
import com.ems.model.Employee;
import com.ems.repository.CompanyRepository;
import com.ems.repository.SalaryRepository;
import com.ems.repository.LeaveTypeRepository;
import com.ems.repository.LeaveBalanceRepository;
import com.ems.repository.LeaveApplicationRepository;
import com.ems.repository.EmployeeRepository;
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
import java.util.Set;
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
    private final EmployeeRepository employeeRepository;

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
        List<Employee> employees = employeeRepository.findAllLiveEmployees();

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body{font-family:Arial,sans-serif;margin:15px;font-size:11px;}");
        html.append(".rule-title{text-align:center;font-size:13px;margin:2px 0;}");
        html.append(".form-title{text-align:center;font-size:16px;font-weight:bold;margin:2px 0;}");
        html.append(".register-title{text-align:center;font-size:13px;font-weight:bold;margin:2px 0;}");
        html.append(".see-rule{text-align:center;font-size:11px;margin:2px 0;color:#333;}");
        html.append(".info-row{font-size:11px;margin:3px 0;}");
        html.append(".emp-section{margin-top:15px;page-break-inside:avoid;}");
        html.append(".emp-header{display:flex;justify-content:space-between;font-size:11px;margin:6px 0;padding:4px 8px;background:#f5f5f5;border:1px solid #000;}");
        html.append(".emp-header div{flex:1;}");
        html.append(".emp-header b{display:inline-block;min-width:160px;}");
        html.append("table{width:100%;border-collapse:collapse;margin-top:4px;table-layout:fixed;}");
        html.append("th,td{border:1px solid #000;padding:3px 4px;text-align:center;font-size:10px;overflow:hidden;word-wrap:break-word;}");
        html.append("th{background:#D9D9D9;font-weight:bold;}");
        html.append(".opening-row td{background:#f9f9f9;font-style:italic;}");
        html.append("@media print{body{margin:10px;}.emp-section{page-break-inside:avoid;}}");
        html.append("</style></head><body>");

        html.append("<div class='rule-title'>The Andhra Pradesh Shops and Establishments Rules</div>");
        html.append("<div class='form-title'>FORM - XXV</div>");
        html.append("<div class='register-title'>REGISTER OF LEAVE</div>");
        html.append("<div class='see-rule'>See Rule 29(6)</div>");
        html.append("<div class='info-row'>Name of the Establishment/Shop : ").append(company.getCompanyName()).append("</div>");
        html.append("<div class='info-row'>Address : ").append(safeStr(company.getAddress())).append("</div>");
        html.append("<div class='info-row'>Registration No : ").append(company.getRegistrationNumber()).append("</div>");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yy");

        for (Employee emp : employees) {
            List<LeaveBalance> empBalances = leaveBalanceRepository.findByEmployeeIdAndYear(emp.getId(), year);
            List<LeaveApplication> empApps = leaveApplicationRepository.findByEmployeeIdAndYear(emp.getId(), year);

            Map<Long, Integer> entitledMap = new java.util.HashMap<>();
            Map<Long, Integer> balanceMap = new java.util.HashMap<>();
            Map<Long, String> typeNameMap = new java.util.HashMap<>();
            for (LeaveBalance lb : empBalances) {
                entitledMap.put(lb.getLeaveType().getId(), lb.getEntitled());
                balanceMap.put(lb.getLeaveType().getId(), lb.getEntitled());
                typeNameMap.put(lb.getLeaveType().getId(), lb.getLeaveType().getName());
            }

            html.append("<div class='emp-section'>");
            html.append("<div class='emp-header'>");
            html.append("<div><b>Name of the employee :</b> ").append(emp.getFullName()).append("</div>");
            html.append("<div><b>Father's/Husband's Name :</b> ").append(safeStr(emp.getFatherHusbandName())).append("</div>");
            html.append("<div><b>Date of appointment :</b> ").append(emp.getDoj() != null ? emp.getDoj().format(dtf) : "-").append("</div>");
            html.append("<div><b>Employee Code :</b> ").append(emp.getEmployeeCode()).append("</div>");
            html.append("</div>");

            html.append("<table>");
            html.append("<thead>");
            html.append("<tr>");
            html.append("<th rowspan='2' style='width:5%'>Date of<br>Application<br>(1)</th>");
            html.append("<th colspan='2'>Applied</th>");
            html.append("<th rowspan='2' style='width:4%'>No. of<br>Days<br>(4)</th>");
            html.append("<th colspan='2'>No. of Days to which<br>the employee is entitled</th>");
            html.append("<th colspan='2'>Leave<br>Granted</th>");
            html.append("<th colspan='2'>No. of<br>Days</th>");
            html.append("<th colspan='3'>If refused, in<br>part or full</th>");
            html.append("<th rowspan='2' style='width:10%'>Reason<br>(13)</th>");
            html.append("<th rowspan='2' style='width:5%'>Signature<br>Employee<br>(14)</th>");
            html.append("<th rowspan='2' style='width:5%'>Signature<br>Employer<br>(15)</th>");
            html.append("</tr>");
            html.append("<tr>");
            html.append("<th>From<br>(2)</th><th>To<br>(3)</th>");
            html.append("<th>CL<br>(5)</th><th>PL</th>");
            html.append("<th>From<br>(6)</th><th>To<br>(7)</th>");
            html.append("<th>CL<br>(8)</th><th>PL<br>(9)</th>");
            html.append("<th>From<br>(10)</th><th>To<br>(11)</th><th>No of<br>Days<br>(12)</th>");
            html.append("</tr>");
            html.append("</thead>");
            html.append("<tbody>");

            html.append("<tr class='opening-row'>");
            html.append("<td>01/04/").append(year).append("</td>");
            html.append("<td></td><td></td><td></td>");
            for (LeaveType lt : leaveTypes) {
                Integer ent = entitledMap.getOrDefault(lt.getId(), 0);
                html.append("<td>").append(ent > 0 ? ent : "-").append("</td>");
            }
            html.append("<td></td><td></td>");
            for (LeaveType lt : leaveTypes) {
                Integer bal = balanceMap.getOrDefault(lt.getId(), 0);
                html.append("<td>").append(bal > 0 ? bal : "-").append("</td>");
            }
            html.append("<td></td><td></td><td></td>");
            html.append("<td>Opening Balance</td><td></td><td></td>");
            html.append("</tr>");

            java.util.List<LeaveApplication> sorted = new java.util.ArrayList<>(empApps);
            sorted.sort(java.util.Comparator.comparing(la -> la.getFromDate()));

            for (LeaveApplication la : sorted) {
                String status = la.getStatus();
                boolean approved = "APPROVED".equalsIgnoreCase(status);
                boolean rejected = "REJECTED".equalsIgnoreCase(status);

                html.append("<tr>");
                html.append("<td>").append(la.getAppliedDate() != null ? la.getAppliedDate().format(dtf) : "-").append("</td>");
                html.append("<td>").append(la.getFromDate() != null ? la.getFromDate().format(dtf) : "").append("</td>");
                html.append("<td>").append(la.getToDate() != null ? la.getToDate().format(dtf) : "").append("</td>");
                html.append("<td>").append(la.getDays() != null ? la.getDays() : "").append("</td>");

                for (LeaveType lt : leaveTypes) {
                    boolean isThisType = la.getLeaveType() != null && la.getLeaveType().getId().equals(lt.getId());
                    if (isThisType && approved) {
                        html.append("<td>").append(la.getDays()).append("</td>");
                    } else {
                        html.append("<td></td>");
                    }
                }

                if (approved) {
                    html.append("<td>").append(la.getFromDate() != null ? la.getFromDate().format(dtf) : "").append("</td>");
                    html.append("<td>").append(la.getToDate() != null ? la.getToDate().format(dtf) : "").append("</td>");
                } else {
                    html.append("<td></td><td></td>");
                }

                for (LeaveType lt : leaveTypes) {
                    boolean isThisType = la.getLeaveType() != null && la.getLeaveType().getId().equals(lt.getId());
                    if (isThisType && approved) {
                        Integer newBal = balanceMap.getOrDefault(lt.getId(), 0) - (la.getDays() != null ? la.getDays() : 0);
                        balanceMap.put(lt.getId(), newBal);
                        html.append("<td>").append(newBal).append("</td>");
                    } else {
                        html.append("<td></td>");
                    }
                }

                if (rejected || "PENDING".equalsIgnoreCase(status)) {
                    html.append("<td>").append(la.getFromDate() != null ? la.getFromDate().format(dtf) : "").append("</td>");
                    html.append("<td>").append(la.getToDate() != null ? la.getToDate().format(dtf) : "").append("</td>");
                    html.append("<td>").append(la.getDays() != null ? la.getDays() : "").append("</td>");
                } else {
                    html.append("<td></td><td></td><td></td>");
                }

                html.append("<td>").append(safeStr(la.getReason())).append("</td>");
                html.append("<td></td><td></td>");
                html.append("</tr>");
            }

            html.append("</tbody></table></div>");
        }

        html.append("</body></html>");
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

    public byte[] generateLeaveRegisterExcel(Integer year, String employeeIds) {
        Company company = getCompany();
        List<LeaveType> leaveTypes = leaveTypeRepository.findByIsActiveTrue();
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

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yy");
        int totalCols = 16;

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Leave Register");
            CellStyle titleStyle = createTitleStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dataStyle = createDataStyle(wb);
            CellStyle empInfoStyle = createEmpInfoStyle(wb);
            CellStyle ruleStyle = createRuleStyle(wb);

            int r = 0;
            createMergedRow(sheet, r++, totalCols, "The Andhra Pradesh Shops and Establishments Rules", ruleStyle);
            createMergedRow(sheet, r++, totalCols, "FORM - XXV", titleStyle);
            createMergedRow(sheet, r++, totalCols, "REGISTER OF LEAVE", titleStyle);
            createMergedRow(sheet, r++, totalCols, "See Rule 29(6)", ruleStyle);
            createMergedRow(sheet, r++, totalCols, "Name of the Establishment/Shop : " + company.getCompanyName(), empInfoStyle);
            createMergedRow(sheet, r++, totalCols, "Address : " + safeStr(company.getAddress()), empInfoStyle);
            createMergedRow(sheet, r++, totalCols, "Registration No : " + company.getRegistrationNumber(), empInfoStyle);
            r++;

            for (Employee emp : employees) {
                if (finalFilterIds != null && !finalFilterIds.contains(emp.getId())) continue;

                List<LeaveBalance> empBalances = leaveBalanceRepository.findByEmployeeIdAndYear(emp.getId(), year);
                List<LeaveApplication> empApps = leaveApplicationRepository.findByEmployeeIdAndYear(emp.getId(), year);

                Map<Long, Integer> entitledMap = new java.util.HashMap<>();
                Map<Long, Integer> balanceMap = new java.util.HashMap<>();
                for (LeaveBalance lb : empBalances) {
                    entitledMap.put(lb.getLeaveType().getId(), lb.getEntitled());
                    balanceMap.put(lb.getLeaveType().getId(), lb.getEntitled());
                }

                createMergedRow(sheet, r++, totalCols,
                    "Name of the employee : " + emp.getFullName() +
                    "  |  Father's/Husband's Name : " + safeStr(emp.getFatherHusbandName()) +
                    "  |  Date of appointment : " + (emp.getDoj() != null ? emp.getDoj().format(dtf) : "-") +
                    "  |  Employee Code : " + emp.getEmployeeCode(),
                    empInfoStyle);

                Row row1 = sheet.createRow(r++);
                Row row2 = sheet.createRow(r++);
                int row1Num = r - 2;
                int row2Num = r - 1;
                int c = 0;
                createCell(row1, c, "Date of\nApplication\n(1)", headerStyle);
                sheet.addMergedRegion(new CellRangeAddress(row1Num, row2Num, c, c));
                createCell(row2, c++, "", headerStyle);

                createCell(row1, c, "Applied", headerStyle);
                createCell(row2, c, "From\n(2)", headerStyle); c++;
                createCell(row2, c, "To\n(3)", headerStyle); c++;
                sheet.addMergedRegion(new CellRangeAddress(row1Num, row1Num, c - 2, c - 1));

                createCell(row1, c, "No. of\nDays\n(4)", headerStyle);
                sheet.addMergedRegion(new CellRangeAddress(row1Num, row2Num, c, c));
                createCell(row2, c++, "", headerStyle);

                createCell(row1, c, "No. of Days to which\nthe employee is entitled", headerStyle);
                createCell(row2, c, "CL\n(5)", headerStyle); c++;
                createCell(row2, c, "PL", headerStyle); c++;
                sheet.addMergedRegion(new CellRangeAddress(row1Num, row1Num, c - 2, c - 1));

                createCell(row1, c, "Leave\nGranted", headerStyle);
                createCell(row2, c, "From\n(6)", headerStyle); c++;
                createCell(row2, c, "To\n(7)", headerStyle); c++;
                sheet.addMergedRegion(new CellRangeAddress(row1Num, row1Num, c - 2, c - 1));

                createCell(row1, c, "No. of\nDays\nBalance", headerStyle);
                createCell(row2, c, "CL\n(8)", headerStyle); c++;
                createCell(row2, c, "PL\n(9)", headerStyle); c++;
                sheet.addMergedRegion(new CellRangeAddress(row1Num, row1Num, c - 2, c - 1));

                createCell(row1, c, "If refused, in\npart or full", headerStyle);
                createCell(row2, c, "From\n(10)", headerStyle); c++;
                createCell(row2, c, "To\n(11)", headerStyle); c++;
                createCell(row2, c, "No of\nDays\n(12)", headerStyle); c++;
                sheet.addMergedRegion(new CellRangeAddress(row1Num, row1Num, c - 3, c - 1));

                createCell(row1, c, "Reason\n(13)", headerStyle);
                sheet.addMergedRegion(new CellRangeAddress(row1Num, row2Num, c, c));
                createCell(row2, c++, "", headerStyle);

                createCell(row1, c, "Signature\nEmployee\n(14)", headerStyle);
                sheet.addMergedRegion(new CellRangeAddress(row1Num, row2Num, c, c));
                createCell(row2, c++, "", headerStyle);

                createCell(row1, c, "Signature\nEmployer\n(15)", headerStyle);
                sheet.addMergedRegion(new CellRangeAddress(row1Num, row2Num, c, c));
                createCell(row2, c++, "", headerStyle);

                Row openRow = sheet.createRow(r++);
                int oc = 0;
                createCell(openRow, oc++, "01/04/" + year, dataStyle);
                createCell(openRow, oc++, "", dataStyle);
                createCell(openRow, oc++, "", dataStyle);
                createCell(openRow, oc++, "", dataStyle);
                for (LeaveType lt : leaveTypes) {
                    Integer ent = entitledMap.getOrDefault(lt.getId(), 0);
                    createCell(openRow, oc++, ent > 0 ? String.valueOf(ent) : "-", dataStyle);
                }
                createCell(openRow, oc++, "", dataStyle);
                createCell(openRow, oc++, "", dataStyle);
                for (LeaveType lt : leaveTypes) {
                    Integer bal = balanceMap.getOrDefault(lt.getId(), 0);
                    createCell(openRow, oc++, bal > 0 ? String.valueOf(bal) : "-", dataStyle);
                }
                createCell(openRow, oc++, "", dataStyle);
                createCell(openRow, oc++, "", dataStyle);
                createCell(openRow, oc++, "", dataStyle);
                createCell(openRow, oc++, "Opening Balance", dataStyle);
                createCell(openRow, oc++, "", dataStyle);
                createCell(openRow, oc++, "", dataStyle);

                java.util.List<LeaveApplication> sorted = new java.util.ArrayList<>(empApps);
                sorted.sort(java.util.Comparator.comparing(la -> la.getFromDate()));

                for (LeaveApplication la : sorted) {
                    String status = la.getStatus();
                    boolean approved = "APPROVED".equalsIgnoreCase(status);

                    Row appRow = sheet.createRow(r++);
                    int ac = 0;
                    createCell(appRow, ac++, la.getAppliedDate() != null ? la.getAppliedDate().format(dtf) : "-", dataStyle);
                    createCell(appRow, ac++, la.getFromDate() != null ? la.getFromDate().format(dtf) : "", dataStyle);
                    createCell(appRow, ac++, la.getToDate() != null ? la.getToDate().format(dtf) : "", dataStyle);
                    createCell(appRow, ac++, la.getDays() != null ? String.valueOf(la.getDays()) : "", dataStyle);

                    for (LeaveType lt : leaveTypes) {
                        boolean isThisType = la.getLeaveType() != null && la.getLeaveType().getId().equals(lt.getId());
                        if (isThisType && approved) {
                            createCell(appRow, ac++, la.getDays(), dataStyle);
                        } else {
                            createCell(appRow, ac++, "", dataStyle);
                        }
                    }

                    if (approved) {
                        createCell(appRow, ac++, la.getFromDate() != null ? la.getFromDate().format(dtf) : "", dataStyle);
                        createCell(appRow, ac++, la.getToDate() != null ? la.getToDate().format(dtf) : "", dataStyle);
                    } else {
                        createCell(appRow, ac++, "", dataStyle);
                        createCell(appRow, ac++, "", dataStyle);
                    }

                    for (LeaveType lt : leaveTypes) {
                        boolean isThisType = la.getLeaveType() != null && la.getLeaveType().getId().equals(lt.getId());
                        if (isThisType && approved) {
                            Integer newBal = balanceMap.getOrDefault(lt.getId(), 0) - (la.getDays() != null ? la.getDays() : 0);
                            balanceMap.put(lt.getId(), newBal);
                            createCell(appRow, ac++, newBal, dataStyle);
                        } else {
                            createCell(appRow, ac++, "", dataStyle);
                        }
                    }

                    if (!approved) {
                        createCell(appRow, ac++, la.getFromDate() != null ? la.getFromDate().format(dtf) : "", dataStyle);
                        createCell(appRow, ac++, la.getToDate() != null ? la.getToDate().format(dtf) : "", dataStyle);
                        createCell(appRow, ac++, la.getDays() != null ? String.valueOf(la.getDays()) : "", dataStyle);
                    } else {
                        createCell(appRow, ac++, "", dataStyle);
                        createCell(appRow, ac++, "", dataStyle);
                        createCell(appRow, ac++, "", dataStyle);
                    }

                    createCell(appRow, ac++, safeStr(la.getReason()), dataStyle);
                    createCell(appRow, ac++, "", dataStyle);
                    createCell(appRow, ac++, "", dataStyle);
                }

                r++;
            }

            for (int i = 0; i < totalCols; i++) sheet.autoSizeColumn(i);
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
        style.setBorderBottom(BorderStyle.THIN);
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
