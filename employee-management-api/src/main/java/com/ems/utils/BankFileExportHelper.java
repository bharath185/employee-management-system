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
public class BankFileExportHelper {

    private static final String[] HEADERS = {
        "Employee Code", "Employee Name", "Account Number", "IFSC Code",
        "Bank Name", "Net Pay", "Bonus", "Total Amount"
    };

    public byte[] generateBankFile(List<Payslip> payslips, String periodLabel) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Bank_File_" + periodLabel);

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle amountStyle = createAmountStyle(workbook);

            // Header row
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 1;
            NumberFormat fmt = NumberFormat.getNumberInstance(Locale.US);
            fmt.setMinimumFractionDigits(2);
            fmt.setMaximumFractionDigits(2);

            for (Payslip payslip : payslips) {
                Employee emp = payslip.getEmployee();
                Row row = sheet.createRow(rowNum++);

                BigDecimal netPay = payslip.getNetPay() != null ? payslip.getNetPay() : BigDecimal.ZERO;
                BigDecimal bonus = payslip.getBonus() != null ? payslip.getBonus() : BigDecimal.ZERO;
                BigDecimal totalAmount = netPay.add(bonus);

                setCell(row, 0, emp.getEmployeeCode(), dataStyle);
                setCell(row, 1, emp.getFullName(), dataStyle);
                setCell(row, 2, emp.getAccountNumber(), dataStyle);
                setCell(row, 3, emp.getIfscCode(), dataStyle);
                setCell(row, 4, emp.getBankName(), dataStyle);
                setNumericCell(row, 5, netPay.doubleValue(), amountStyle);
                setNumericCell(row, 6, bonus.doubleValue(), amountStyle);
                setNumericCell(row, 7, totalAmount.doubleValue(), amountStyle);
            }

            // Auto-size columns
            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate bank file Excel", e);
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
}
