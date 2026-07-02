package com.ems.utils;

import com.ems.model.Employee;
import com.ems.model.Payslip;
import lombok.NoArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;

@Component
@NoArgsConstructor
public class PayrollReportExportHelper {

    private static final String[] HEADERS = {
        "S No", "Employee Code", "Employee Name", "Designation", "Department",
        "Bank Name", "Account Number", "UAN", "PF No.", "ESIC No.",
        "Basic", "HRA", "Fixed Personal Allowance", "Other Allowance",
        "Bonus", "Appraisal Amount", "Late Sitting Amount",
        "Gross Salary", "PF Deduction", "ESI Deduction", "PT Deduction",
        "Total Deductions", "Overtime Wages", "Net Pay",
        "Present Days", "Absent Days", "Leave Days", "Total Working Days",
        "Status"
    };

    public byte[] generatePayrollReport(List<Payslip> payslips, String periodLabel) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Payroll_Report_" + periodLabel);

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle amountStyle = createAmountStyle(workbook);

            // Title row
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Payroll Report - " + periodLabel);
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            // Header row
            Row headerRow = sheet.createRow(2);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 3;
            int serialNo = 1;
            NumberFormat fmt = NumberFormat.getNumberInstance(Locale.US);
            fmt.setMinimumFractionDigits(2);
            fmt.setMaximumFractionDigits(2);

            for (Payslip payslip : payslips) {
                Employee emp = payslip.getEmployee();
                Row row = sheet.createRow(rowNum++);

                setCell(row, 0, String.valueOf(serialNo++), dataStyle);
                setCell(row, 1, emp.getEmployeeCode(), dataStyle);
                setCell(row, 2, emp.getFullName(), dataStyle);
                setCell(row, 3, emp.getDesignation(), dataStyle);
                setCell(row, 4, emp.getProcessAssigned(), dataStyle);
                setCell(row, 5, emp.getBankName(), dataStyle);
                setCell(row, 6, emp.getAccountNumber(), dataStyle);
                setCell(row, 7, emp.getUanNo(), dataStyle);
                setCell(row, 8, emp.getPfNo(), dataStyle);
                setCell(row, 9, emp.getEsicNo(), dataStyle);

                setNumericCell(row, 10, safeDouble(payslip.getBasic()), amountStyle);
                setNumericCell(row, 11, safeDouble(payslip.getHra()), amountStyle);
                setNumericCell(row, 12, safeDouble(payslip.getFixedPersonalAllowance()), amountStyle);
                setNumericCell(row, 13, safeDouble(payslip.getOtherAllowance()), amountStyle);
                setNumericCell(row, 14, safeDouble(payslip.getBonus()), amountStyle);
                setNumericCell(row, 15, safeDouble(payslip.getAppraisalAmount()), amountStyle);
                setNumericCell(row, 16, safeDouble(payslip.getLateSittingAmount()), amountStyle);
                setNumericCell(row, 17, safeDouble(payslip.getGrossSalary()), amountStyle);
                setNumericCell(row, 18, safeDouble(payslip.getPfDeduction()), amountStyle);
                setNumericCell(row, 19, safeDouble(payslip.getEsiDeduction()), amountStyle);
                setNumericCell(row, 20, safeDouble(payslip.getPtDeduction()), amountStyle);
                setNumericCell(row, 21, safeDouble(payslip.getTotalDeductions()), amountStyle);
                setNumericCell(row, 22, safeDouble(payslip.getOvertimeWages()), amountStyle);
                setNumericCell(row, 23, safeDouble(payslip.getNetPay()), amountStyle);

                setCell(row, 24, payslip.getPresentDays() != null ? payslip.getPresentDays().toString() : "", dataStyle);
                setCell(row, 25, payslip.getAbsentDays() != null ? payslip.getAbsentDays().toString() : "", dataStyle);
                setCell(row, 26, payslip.getLeaveDays() != null ? payslip.getLeaveDays().toString() : "", dataStyle);
                setCell(row, 27, payslip.getTotalWorkingDays() != null ? payslip.getTotalWorkingDays().toString() : "", dataStyle);
                setCell(row, 28, payslip.getStatus(), dataStyle);
            }

            // Summary row
            if (!payslips.isEmpty()) {
                Row summaryRow = sheet.createRow(rowNum + 1);
                CellStyle summaryStyle = workbook.createCellStyle();
                Font summaryFont = workbook.createFont();
                summaryFont.setBold(true);
                summaryStyle.setFont(summaryFont);
                summaryStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
                summaryStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

                setCell(summaryRow, 0, "TOTAL", summaryStyle);
                setCell(summaryRow, 1, "", summaryStyle);
                setCell(summaryRow, 2, "", summaryStyle);
                setCell(summaryRow, 3, "", summaryStyle);
                setCell(summaryRow, 4, "", summaryStyle);
                setCell(summaryRow, 5, "", summaryStyle);
                setCell(summaryRow, 6, "", summaryStyle);
                setCell(summaryRow, 7, "", summaryStyle);
                setCell(summaryRow, 8, "", summaryStyle);
                setCell(summaryRow, 9, "", summaryStyle);

                BigDecimal totalBasic = payslips.stream().map(p -> safe(p.getBasic())).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalHra = payslips.stream().map(p -> safe(p.getHra())).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalFpa = payslips.stream().map(p -> safe(p.getFixedPersonalAllowance())).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalOa = payslips.stream().map(p -> safe(p.getOtherAllowance())).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalBonus = payslips.stream().map(p -> safe(p.getBonus())).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalAppraisal = payslips.stream().map(p -> safe(p.getAppraisalAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalLate = payslips.stream().map(p -> safe(p.getLateSittingAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalGross = payslips.stream().map(p -> safe(p.getGrossSalary())).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalPf = payslips.stream().map(p -> safe(p.getPfDeduction())).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalEsi = payslips.stream().map(p -> safe(p.getEsiDeduction())).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalPt = payslips.stream().map(p -> safe(p.getPtDeduction())).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalDed = payslips.stream().map(p -> safe(p.getTotalDeductions())).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalOt = payslips.stream().map(p -> safe(p.getOvertimeWages())).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalNet = payslips.stream().map(p -> safe(p.getNetPay())).reduce(BigDecimal.ZERO, BigDecimal::add);

                setNumericCell(summaryRow, 10, totalBasic.doubleValue(), summaryStyle);
                setNumericCell(summaryRow, 11, totalHra.doubleValue(), summaryStyle);
                setNumericCell(summaryRow, 12, totalFpa.doubleValue(), summaryStyle);
                setNumericCell(summaryRow, 13, totalOa.doubleValue(), summaryStyle);
                setNumericCell(summaryRow, 14, totalBonus.doubleValue(), summaryStyle);
                setNumericCell(summaryRow, 15, totalAppraisal.doubleValue(), summaryStyle);
                setNumericCell(summaryRow, 16, totalLate.doubleValue(), summaryStyle);
                setNumericCell(summaryRow, 17, totalGross.doubleValue(), summaryStyle);
                setNumericCell(summaryRow, 18, totalPf.doubleValue(), summaryStyle);
                setNumericCell(summaryRow, 19, totalEsi.doubleValue(), summaryStyle);
                setNumericCell(summaryRow, 20, totalPt.doubleValue(), summaryStyle);
                setNumericCell(summaryRow, 21, totalDed.doubleValue(), summaryStyle);
                setNumericCell(summaryRow, 22, totalOt.doubleValue(), summaryStyle);
                setNumericCell(summaryRow, 23, totalNet.doubleValue(), summaryStyle);
            }

            // Auto-size columns
            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate payroll report Excel", e);
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createAmountStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        return style;
    }

    private void setCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    private void setNumericCell(Row row, int col, double value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private BigDecimal safe(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    private double safeDouble(BigDecimal val) {
        return val != null ? val.doubleValue() : 0.0;
    }
}
