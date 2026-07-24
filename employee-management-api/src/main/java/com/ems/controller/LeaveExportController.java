package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.model.*;
import com.ems.repository.*;
import com.ems.service.CompanyService;
import com.ems.service.LeaveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/leave/export")
@RequiredArgsConstructor
public class LeaveExportController {

    private final LeaveService leaveService;
    private final EmployeeRepository employeeRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveApplicationRepository leaveApplicationRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final CompanyService companyService;

    private static final DateTimeFormatter DD_MM_YYYY = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @GetMapping("/sample-balances")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> downloadSampleBalances(@RequestParam Integer year) {
        String filename = "Leave_Register_XXV_Sample_" + year + ".xlsx";
        List<Employee> employees = employeeRepository.findAll();
        Company company = companyService.getCompany();

        try (Workbook wb = new XSSFWorkbook()) {
            generateFormXXV(wb, year, employees, company, true);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            wb.write(baos);

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(baos.toByteArray());
        } catch (Exception e) {
            log.error("Failed to generate FORM XXV sample: {}", e.getMessage());
            throw new RuntimeException("Failed to generate sample", e);
        }
    }

    @GetMapping("/balances")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> exportBalances(@RequestParam Integer year) {
        String filename = "Leave_Register_XXV_" + year + ".xlsx";
        List<Employee> employees = employeeRepository.findAll();
        Company company = companyService.getCompany();

        try (Workbook wb = new XSSFWorkbook()) {
            generateFormXXV(wb, year, employees, company, false);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            wb.write(baos);

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(baos.toByteArray());
        } catch (Exception e) {
            log.error("Failed to generate FORM XXV: {}", e.getMessage());
            throw new RuntimeException("Failed to export", e);
        }
    }

    private void generateFormXXV(Workbook wb, Integer year, List<Employee> employees, Company company, boolean isSample) {
        CellStyle headerBoldStyle = createHeaderBoldStyle(wb);
        CellStyle titleStyle = createTitleStyle(wb);
        CellStyle colHeaderStyle = createColHeaderStyle(wb);
        CellStyle cellStyle = createBorderStyle(wb);
        CellStyle sampleStyle = createSampleStyle(wb);

        List<LeaveType> leaveTypes = leaveService.getLeaveTypes();
        String clName = "CL";
        String plName = "PL";
        for (LeaveType lt : leaveTypes) {
            if (lt.getName().toLowerCase().contains("casual") || lt.getName().equalsIgnoreCase("CL")) clName = lt.getName();
            if (lt.getName().toLowerCase().contains("privilege") || lt.getName().toLowerCase().contains("earned") || lt.getName().equalsIgnoreCase("PL")) plName = lt.getName();
        }

        for (Employee emp : employees) {
            Sheet sheet = wb.createSheet(truncate(emp.getEmployeeCode(), 28));
            int rowIdx = 0;

            // Company header
            Row r0 = sheet.createRow(rowIdx++);
            setMergedCell(sheet, r0, 0, 9, "Name of the Establishment / Shop : " + safe(company.getCompanyName()), headerBoldStyle);

            Row r1 = sheet.createRow(rowIdx++);
            setMergedCell(sheet, r1, 0, 9, "Address : " + safe(company.getAddress()), headerBoldStyle);

            Row r2 = sheet.createRow(rowIdx++);
            setMergedCell(sheet, r2, 0, 9, "Registration No. " + safe(company.getRegistrationNumber()), headerBoldStyle);

            rowIdx++; // blank row

            // FORM XXV title
            Row r4 = sheet.createRow(rowIdx++);
            setMergedCell(sheet, r4, 0, 9, "The Andhra Pradesh Shops and Establishments Rules", titleStyle);

            Row r5 = sheet.createRow(rowIdx++);
            setMergedCell(sheet, r5, 0, 9, "FORM - XXV", titleStyle);

            Row r6 = sheet.createRow(rowIdx++);
            setMergedCell(sheet, r6, 0, 9, "REGISTER OF LEAVE", titleStyle);

            Row r7 = sheet.createRow(rowIdx++);
            setMergedCell(sheet, r7, 0, 9, "See Rule 29(6)", titleStyle);

            Row r8 = sheet.createRow(rowIdx++);
            setMergedCell(sheet, r8, 0, 9, "LEAVE WITH WAGES", titleStyle);

            rowIdx++; // blank row

            // Employee info
            Row empR1 = sheet.createRow(rowIdx++);
            setCell(empR1, 0, "Name of the employee", headerBoldStyle);
            setCell(empR1, 1, safe(emp.getFullName()), cellStyle);
            setCell(empR1, 4, "Employee Code", headerBoldStyle);
            setCell(empR1, 5, safe(emp.getEmployeeCode()), cellStyle);

            Row empR2 = sheet.createRow(rowIdx++);
            String fmhLabel = emp.getFMH() != null ? "Father's/" + emp.getFMH() + "'s Name" : "Father's/husband's Name";
            setCell(empR2, 0, fmhLabel, headerBoldStyle);
            setCell(empR2, 1, safe(emp.getFatherHusbandName()), cellStyle);
            setCell(empR2, 4, "Designation", headerBoldStyle);
            setCell(empR2, 5, safe(emp.getDesignation()), cellStyle);

            Row empR3 = sheet.createRow(rowIdx++);
            setCell(empR3, 0, "Date of appointment", headerBoldStyle);
            setCell(empR3, 1, emp.getDoj() != null ? emp.getDoj().format(DD_MM_YYYY) : "", cellStyle);
            setCell(empR3, 4, "Department", headerBoldStyle);
            setCell(empR3, 5, safe(emp.getDepartment()), cellStyle);

            rowIdx++; // blank row

            // Table headers (2 rows)
            // Row 1: merged headers
            Row th1 = sheet.createRow(rowIdx++);
            setCell(th1, 0, "Date of", colHeaderStyle);
            setCell(th1, 1, "Applied", colHeaderStyle);
            setCell(th1, 2, "", colHeaderStyle);
            setCell(th1, 3, "No. of", colHeaderStyle);
            setCell(th1, 4, "No. of Days to which", colHeaderStyle);
            setCell(th1, 5, "the employee is", colHeaderStyle);
            setCell(th1, 6, "entitled", colHeaderStyle);
            setCell(th1, 7, "Leave Granted", colHeaderStyle);
            setCell(th1, 8, "", colHeaderStyle);
            setCell(th1, 9, "No. of Days", colHeaderStyle);

            // Row 2: sub-headers
            Row th2 = sheet.createRow(rowIdx++);
            setCell(th2, 0, "Application", colHeaderStyle);
            setCell(th2, 1, "From", colHeaderStyle);
            setCell(th2, 2, "To", colHeaderStyle);
            setCell(th2, 3, "Days", colHeaderStyle);
            setCell(th2, 4, clName, colHeaderStyle);
            setCell(th2, 5, plName, colHeaderStyle);
            setCell(th2, 6, "From", colHeaderStyle);
            setCell(th2, 7, "To", colHeaderStyle);
            setCell(th2, 8, "Days", colHeaderStyle);
            setCell(th2, 9, clName, colHeaderStyle);

            // Additional columns for PL balance, refused, reason, signatures
            setCell(th1, 10, "Balance", colHeaderStyle);
            setCell(th1, 11, "", colHeaderStyle);
            setCell(th1, 12, "If refused, in part or full", colHeaderStyle);
            setCell(th1, 13, "", colHeaderStyle);
            setCell(th1, 14, "", colHeaderStyle);
            setCell(th1, 15, "", colHeaderStyle);
            setCell(th1, 16, "", colHeaderStyle);
            setCell(th1, 17, "Signature of", colHeaderStyle);
            setCell(th1, 18, "", colHeaderStyle);

            setCell(th2, 10, plName, colHeaderStyle);
            setCell(th2, 11, "From", colHeaderStyle);
            setCell(th2, 12, "To", colHeaderStyle);
            setCell(th2, 13, "Days", colHeaderStyle);
            setCell(th2, 14, "Reason", colHeaderStyle);
            setCell(th2, 15, "Employee", colHeaderStyle);
            setCell(th2, 16, "Employer", colHeaderStyle);
            setCell(th2, 17, "Date of", colHeaderStyle);
            setCell(th2, 18, "Application", colHeaderStyle);

            // Data rows from leave applications
            List<LeaveApplication> apps = leaveApplicationRepository.findByEmployeeIdAndYear(emp.getId(), year);
            List<LeaveBalance> balances = leaveBalanceRepository.findByEmployeeIdAndYear(emp.getId(), year);

            Map<String, Integer> balanceMap = new HashMap<>();
            for (LeaveBalance lb : balances) {
                String key = lb.getLeaveType().getName().toUpperCase().contains("CASUAL") ? "CL" :
                             lb.getLeaveType().getName().toUpperCase().contains("PRIVILEGE") || lb.getLeaveType().getName().toUpperCase().contains("EARNED") ? "PL" :
                             lb.getLeaveType().getName().toUpperCase().contains("SICK") ? "SL" : lb.getLeaveType().getName();
                balanceMap.put(key + "_entitled", lb.getEntitled());
                balanceMap.put(key + "_taken", lb.getTaken());
                balanceMap.put(key + "_balance", lb.getBalance());
            }

            if (isSample && apps.isEmpty()) {
                // Add sample rows
                String[] row1 = {"Apr 1, 2026 opening balance", "", "", "", "1", "19.5", "", "", "", "", "", "", "", "", "", "", "", ""};
                addSampleRow(sheet, rowIdx++, row1, sampleStyle);
                String[] row2 = {"07/05/2026", "08/05/2026", "08/05/2026", "1", "1", "1", "08/05/2026", "08/05/2026", "1", "1", "21", "", "", "", "", "P. Reddy Praveen", "", ""};
                addSampleRow(sheet, rowIdx++, row2, sampleStyle);
                String[] row3 = {"15/05/2026", "14/05/2026", "16/05/2026", "1", "2", "21", "14/05/2026", "16/05/2026", "1", "0", "21", "", "", "", "", "P. Reddy Praveen", "", ""};
                addSampleRow(sheet, rowIdx++, row3, sampleStyle);
            } else {
                for (LeaveApplication app : apps) {
                    Row dr = sheet.createRow(rowIdx++);
                    setCell(dr, 0, app.getAppliedDate() != null ? app.getAppliedDate().format(DD_MM_YYYY) : "", cellStyle);
                    setCell(dr, 1, app.getFromDate() != null ? app.getFromDate().format(DD_MM_YYYY) : "", cellStyle);
                    setCell(dr, 2, app.getToDate() != null ? app.getToDate().format(DD_MM_YYYY) : "", cellStyle);
                    setCell(dr, 3, String.valueOf(app.getDays()), cellStyle);
                    setCell(dr, 4, "", cellStyle);
                    setCell(dr, 5, "", cellStyle);
                    setCell(dr, 6, "APPROVED".equals(app.getStatus()) && app.getFromDate() != null ? app.getFromDate().format(DD_MM_YYYY) : "", cellStyle);
                    setCell(dr, 7, "APPROVED".equals(app.getStatus()) && app.getToDate() != null ? app.getToDate().format(DD_MM_YYYY) : "", cellStyle);
                    setCell(dr, 8, "APPROVED".equals(app.getStatus()) ? String.valueOf(app.getDays()) : "", cellStyle);
                    setCell(dr, 9, "", cellStyle);
                    setCell(dr, 10, "", cellStyle);
                    setCell(dr, 11, "REJECTED".equals(app.getStatus()) && app.getFromDate() != null ? app.getFromDate().format(DD_MM_YYYY) : "", cellStyle);
                    setCell(dr, 12, "REJECTED".equals(app.getStatus()) && app.getToDate() != null ? app.getToDate().format(DD_MM_YYYY) : "", cellStyle);
                    setCell(dr, 13, "REJECTED".equals(app.getStatus()) ? String.valueOf(app.getDays()) : "", cellStyle);
                    setCell(dr, 14, safe(app.getReason()), cellStyle);
                    setCell(dr, 15, "", cellStyle);
                    setCell(dr, 16, "", cellStyle);
                    setCell(dr, 17, "", cellStyle);
                    setCell(dr, 18, "", cellStyle);
                }
            }

            // Balance summary row
            if (!apps.isEmpty() || isSample) {
                Row br = sheet.createRow(rowIdx++);
                setCell(br, 0, "Balance", headerBoldStyle);
                int clEntitled = balanceMap.getOrDefault("CL_entitled", isSample ? 12 : 0);
                int clTaken = balanceMap.getOrDefault("CL_taken", isSample ? 1 : 0);
                int clBalance = balanceMap.getOrDefault("CL_balance", isSample ? 11 : 0);
                int plEntitled = balanceMap.getOrDefault("PL_entitled", isSample ? 21 : 0);
                int plTaken = balanceMap.getOrDefault("PL_taken", isSample ? 0 : 0);
                int plBalance = balanceMap.getOrDefault("PL_balance", isSample ? 21 : 0);
                setCell(br, 4, String.valueOf(clEntitled), cellStyle);
                setCell(br, 5, String.valueOf(plEntitled), cellStyle);
                setCell(br, 8, String.valueOf(clTaken), cellStyle);
                setCell(br, 9, String.valueOf(clBalance), cellStyle);
                setCell(br, 10, String.valueOf(plBalance), cellStyle);
            }

            // Auto-size columns
            for (int c = 0; c < 19; c++) {
                sheet.autoSizeColumn(c);
            }
            // Minimum widths
            sheet.setColumnWidth(0, Math.max(sheet.getColumnWidth(0), 3500));
            sheet.setColumnWidth(1, Math.max(sheet.getColumnWidth(1), 3000));
            sheet.setColumnWidth(2, Math.max(sheet.getColumnWidth(2), 3000));
        }
    }

    private void addSampleRow(Sheet sheet, int rowIdx, String[] cols, CellStyle sampleStyle) {
        Row r = sheet.createRow(rowIdx);
        for (int i = 0; i < cols.length; i++) {
            setCell(r, i, cols[i], sampleStyle);
        }
    }

    @PostMapping("/import-balances")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Map<String, Object>>> importBalances(
            @RequestParam("file") MultipartFile file,
            @RequestParam Integer year) {
        List<Map<String, String>> errors = new ArrayList<>();
        int imported = 0;

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            Map<String, Employee> employeeMap = employeeRepository.findAll().stream()
                .collect(Collectors.toMap(Employee::getEmployeeCode, e -> e, (a, b) -> a));
            Map<String, LeaveType> leaveTypeMap = leaveTypeRepository.findByIsActiveTrue().stream()
                .collect(Collectors.toMap(LeaveType::getName, lt -> lt, (a, b) -> a));

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String empCode = getCellStringValue(row.getCell(0));
                String leaveTypeName = getCellStringValue(row.getCell(1));
                String entitledStr = getCellStringValue(row.getCell(3));
                String takenStr = getCellStringValue(row.getCell(4));

                if (empCode == null || empCode.isBlank()) continue;
                if (leaveTypeName == null || leaveTypeName.isBlank()) continue;

                try {
                    Employee emp = employeeMap.get(empCode.trim());
                    if (emp == null) { errors.add(Map.of("row", String.valueOf(i + 1), "message", "Employee not found: " + empCode)); continue; }
                    LeaveType lt = leaveTypeMap.get(leaveTypeName.trim());
                    if (lt == null) { errors.add(Map.of("row", String.valueOf(i + 1), "message", "Leave type not found: " + leaveTypeName)); continue; }
                    Integer entitled = entitledStr != null ? Integer.parseInt(entitledStr.trim()) : null;
                    Integer taken = takenStr != null ? Integer.parseInt(takenStr.trim()) : 0;
                    if (entitled == null) { errors.add(Map.of("row", String.valueOf(i + 1), "message", "Entitled days missing")); continue; }
                    leaveService.updateBalanceByEmployee(empCode.trim(), leaveTypeName.trim(), year, entitled, taken);
                    imported++;
                } catch (Exception e) {
                    errors.add(Map.of("row", String.valueOf(i + 1), "message", e.getMessage()));
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse Excel file", e);
        }

        log.info("Leave balance import: {} records, {} errors", imported, errors.size());
        return ResponseEntity.ok(APIResponse.success(Map.of("imported", imported, "errors", errors)));
    }

    private CellStyle createHeaderBoldStyle(Workbook wb) {
        Font boldFont = wb.createFont();
        boldFont.setBold(true);
        boldFont.setFontHeightInPoints((short) 11);
        CellStyle style = wb.createCellStyle();
        style.setFont(boldFont);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createTitleStyle(Workbook wb) {
        Font boldFont = wb.createFont();
        boldFont.setBold(true);
        boldFont.setFontHeightInPoints((short) 12);
        CellStyle style = wb.createCellStyle();
        style.setFont(boldFont);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createColHeaderStyle(Workbook wb) {
        Font boldFont = wb.createFont();
        boldFont.setBold(true);
        boldFont.setFontHeightInPoints((short) 10);
        CellStyle style = wb.createCellStyle();
        style.setFont(boldFont);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setWrapText(true);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private CellStyle createBorderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setWrapText(true);
        return style;
    }

    private CellStyle createSampleStyle(Workbook wb) {
        CellStyle style = createBorderStyle(wb);
        style.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private void setCell(Row row, int col, String value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value != null ? value : "");
        c.setCellStyle(style);
    }

    private void setMergedCell(Sheet sheet, Row row, int startCol, int endCol, String value, CellStyle style) {
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(row.getRowNum(), row.getRowNum(), startCol, endCol));
        Cell c = row.createCell(startCol);
        c.setCellValue(value != null ? value : "");
        c.setCellStyle(style);
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) yield String.valueOf((long) val);
                yield String.valueOf(val);
            }
            case FORMULA -> { try { yield String.valueOf((long) cell.getNumericCellValue()); } catch (Exception e) { yield ""; } }
            default -> null;
        };
    }

    private String safe(String s) { return s != null ? s : ""; }
    private String truncate(String s, int max) { return s != null && s.length() > max ? s.substring(0, max) : s; }
}
