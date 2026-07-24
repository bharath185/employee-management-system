package com.ems.service;

import com.ems.model.Employee;
import com.ems.model.LeaveBalance;
import com.ems.model.LeaveType;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.LeaveBalanceRepository;
import com.ems.repository.LeaveTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveExcelService {

    private static final String EXCEL_PATH = "H:\\PARIKAR\\docs\\Leve details format.xlsx";
    private static final int HEADER_ROW = 1;
    private static final int DATA_START_ROW = 2;
    private static final int TITLE_ROW = 0;

    // Column indices (0-based)
    private static final int COL_SNO = 0;
    private static final int COL_GENDER = 1;
    private static final int COL_EMP_CODE = 2;
    private static final int COL_EMP_NAME = 3;
    private static final int COL_DEPT = 4;
    private static final int COL_DOJ = 5;
    private static final int COL_VINTAGE = 6;
    private static final int COL_CL_OPENING = 7;
    private static final int COL_PL_OPENING = 8;
    private static final int COL_CL_ADDED = 9;
    private static final int COL_PL_ADDED = 10;
    private static final int COL_CL_AFTER_ADD = 11;
    private static final int COL_PL_AFTER_ADD = 12;
    private static final int COL_CL_AVAILED = 13;
    private static final int COL_PL_AVAILED = 14;
    private static final int COL_LOP = 15;
    private static final int COL_TOTAL_AVAILED = 16;
    private static final int COL_CL_CLOSING = 17;
    private static final int COL_PL_CLOSING = 18;
    private static final int COL_LAST_WORKING_DAY = 19;
    private static final int COL_REMARKS = 20;

    private final EmployeeRepository employeeRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;

    private String getCellStringValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double v = cell.getNumericCellValue();
                if (v == Math.floor(v) && !Double.isInfinite(v))
                    yield String.valueOf((long) v);
                yield String.valueOf(v);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private double getCellNumericValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return 0;
        return switch (cell.getCellType()) {
            case NUMERIC -> cell.getNumericCellValue();
            case STRING -> {
                try { yield Double.parseDouble(cell.getStringCellValue().trim()); }
                catch (NumberFormatException e) { yield 0; }
            }
            default -> 0;
        };
    }

    private String normalizeEmpCode(String code) {
        if (code == null || code.isBlank()) return "";
        String numeric = code.replaceAll("[^0-9]", "");
        String prefix = code.replaceAll("[0-9]", "");
        if (numeric.isEmpty()) return code.toUpperCase();
        return prefix.toUpperCase() + String.format("%03d", Integer.parseInt(numeric));
    }

    private void setCellValue(Row row, int col, String value) {
        Cell cell = row.getCell(col);
        if (cell == null) cell = row.createCell(col);
        cell.setCellValue(value);
    }

    private void setCellValue(Row row, int col, double value) {
        Cell cell = row.getCell(col);
        if (cell == null) cell = row.createCell(col);
        cell.setCellValue(value);
    }

    @Transactional
    public void initFromExcel(int month, int year) {
        log.info("Initializing leave data from Excel for {}/{}", month, year);
        Workbook wb;
        try (FileInputStream fis = new FileInputStream(EXCEL_PATH)) {
            wb = new XSSFWorkbook(fis);
        } catch (IOException e) {
            log.error("Failed to read Excel: {}", e.getMessage());
            return;
        }
        try {
            Sheet sheet = wb.getSheetAt(0);
            if (sheet.getLastRowNum() < DATA_START_ROW) {
                log.warn("Excel has no data rows");
                return;
            }
            for (int i = DATA_START_ROW; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String code = getCellStringValue(row, COL_EMP_CODE);
                if (code.isBlank()) continue;
                processExcelRow(row, month, year);
            }
            try (FileOutputStream fos = new FileOutputStream(EXCEL_PATH)) {
                wb.write(fos);
            }
            log.info("Excel import complete for {}/{}", month, year);
        } catch (IOException e) {
            log.error("Failed to save Excel after import: {}", e.getMessage());
        } finally {
            try { wb.close(); } catch (IOException e) { /* ignore */ }
        }
    }

    public void syncFromDbToExcel(int month, int year) {
        log.info("Syncing DB data to Excel for {}/{}", month, year);
        List<Employee> employees = employeeRepository.findAllLiveEmployees();
        if (employees.isEmpty()) {
            employees = employeeRepository.findAll();
        }
        createSheet(employees, month, year);
    }

    private List<Row> readExcelRows() {
        List<Row> rows = new ArrayList<>();
        try (FileInputStream fis = new FileInputStream(EXCEL_PATH);
             Workbook wb = new XSSFWorkbook(fis)) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = DATA_START_ROW; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    String code = getCellStringValue(row, COL_EMP_CODE);
                    if (!code.isBlank()) rows.add(row);
                }
            }
        } catch (IOException e) {
            log.error("Failed to read Excel: {}", e.getMessage());
        }
        return rows;
    }

    private void processExcelRow(Row row, int month, int year) {
        String excelCode = getCellStringValue(row, COL_EMP_CODE);
        String normCode = normalizeEmpCode(excelCode);
        Optional<Employee> empOpt = employeeRepository.findByEmployeeCode(normCode);
        if (empOpt.isEmpty()) {
            log.warn("Employee not found for Excel code: {} (normalized: {})", excelCode, normCode);
            return;
        }
        Employee emp = empOpt.get();

        double clOpening = getCellNumericValue(row, COL_CL_OPENING);
        double plOpening = getCellNumericValue(row, COL_PL_OPENING);
        double clAdded = getCellNumericValue(row, COL_CL_ADDED);
        double plAdded = getCellNumericValue(row, COL_PL_ADDED);
        double clAvailed = getCellNumericValue(row, COL_CL_AVAILED);
        double plAvailed = getCellNumericValue(row, COL_PL_AVAILED);

        double clAfterAdd = clOpening + clAdded;
        double plAfterAdd = plOpening + plAdded;
        double clClosing = clAfterAdd - clAvailed;
        double plClosing = plAfterAdd - plAvailed;
        double totalAvailed = clAvailed + plAvailed + getCellNumericValue(row, COL_LOP);

        setCellValue(row, COL_CL_AFTER_ADD, clAfterAdd);
        setCellValue(row, COL_PL_AFTER_ADD, plAfterAdd);
        setCellValue(row, COL_CL_CLOSING, clClosing);
        setCellValue(row, COL_PL_CLOSING, plClosing);
        setCellValue(row, COL_TOTAL_AVAILED, totalAvailed);

        syncDbFromRow(emp, "CL", (int) Math.round(clOpening + clAdded), (int) Math.round(clAvailed), year);
        syncDbFromRow(emp, "PL", (int) Math.round(plOpening + plAdded), (int) Math.round(plAvailed), year);
    }

    private void syncDbFromRow(Employee emp, String leaveTypeName, int entitled, int taken, int year) {
        Optional<LeaveType> ltOpt = leaveTypeRepository.findByName(leaveTypeName);
        if (ltOpt.isEmpty()) {
            log.warn("Leave type '{}' not found in DB", leaveTypeName);
            return;
        }
        LeaveType lt = ltOpt.get();
        Optional<LeaveBalance> lbOpt = leaveBalanceRepository
            .findByEmployeeIdAndLeaveTypeIdAndYear(emp.getId(), lt.getId(), year);
        LeaveBalance lb;
        if (lbOpt.isPresent()) {
            lb = lbOpt.get();
        } else {
            lb = new LeaveBalance();
            lb.setEmployee(emp);
            lb.setLeaveType(lt);
            lb.setYear(year);
        }
        lb.setEntitled(entitled);
        lb.setTaken(taken);
        leaveBalanceRepository.save(lb);
    }

    @Transactional
    public void updateAvailed(String empCode, String leaveTypeName, double days, int month, int year) {
        log.info("Updating availed leave for {}: {} {} days", empCode, leaveTypeName, days);
        Workbook wb;
        try (FileInputStream fis = new FileInputStream(EXCEL_PATH)) {
            wb = new XSSFWorkbook(fis);
        } catch (IOException e) {
            log.error("Failed to read Excel for availed update: {}", e.getMessage());
            return;
        }
        try {
            Sheet sheet = wb.getSheetAt(0);
            if (!isCurrentMonthSheet(sheet, month, year)) {
                log.warn("Excel sheet is not for current month {}/{}", month, year);
                return;
            }
            int rowIdx = findEmployeeRow(sheet, empCode);
            if (rowIdx < 0) {
                log.warn("Employee {} not found in Excel for availed update", empCode);
                return;
            }
            Row row = sheet.getRow(rowIdx);

            int availedCol = leaveTypeName.equalsIgnoreCase("CL") ? COL_CL_AVAILED : COL_PL_AVAILED;
            int openingCol = leaveTypeName.equalsIgnoreCase("CL") ? COL_CL_OPENING : COL_PL_OPENING;
            int addedCol = leaveTypeName.equalsIgnoreCase("CL") ? COL_CL_ADDED : COL_PL_ADDED;
            int afterAddCol = leaveTypeName.equalsIgnoreCase("CL") ? COL_CL_AFTER_ADD : COL_PL_AFTER_ADD;
            int closingCol = leaveTypeName.equalsIgnoreCase("CL") ? COL_CL_CLOSING : COL_PL_CLOSING;

            double currentAvailed = getCellNumericValue(row, availedCol);
            double newAvailed = currentAvailed + days;
            double opening = getCellNumericValue(row, openingCol);
            double added = getCellNumericValue(row, addedCol);
            double afterAdd = opening + added;
            double closing = afterAdd - newAvailed;

            setCellValue(row, availedCol, newAvailed);
            setCellValue(row, afterAddCol, afterAdd);
            setCellValue(row, closingCol, closing);

            double clAvailed = getCellNumericValue(row, COL_CL_AVAILED);
            double plAvailed = getCellNumericValue(row, COL_PL_AVAILED);
            double lop = getCellNumericValue(row, COL_LOP);
            setCellValue(row, COL_TOTAL_AVAILED, clAvailed + plAvailed + lop);

            try (FileOutputStream fos = new FileOutputStream(EXCEL_PATH)) {
                wb.write(fos);
            }
            log.info("Excel updated for {}: {} availed now {}", empCode, leaveTypeName, newAvailed);

        } catch (IOException e) {
            log.error("Failed to update Excel for availed leave: {}", e.getMessage());
        } finally {
            try { wb.close(); } catch (IOException e) { /* ignore */ }
        }
    }

    @Transactional
    public void restoreAvailed(String empCode, String leaveTypeName, double days, int month, int year) {
        log.info("Restoring availed leave for {}: {} {} days", empCode, leaveTypeName, days);
        Workbook wb;
        try (FileInputStream fis = new FileInputStream(EXCEL_PATH)) {
            wb = new XSSFWorkbook(fis);
        } catch (IOException e) {
            log.error("Failed to read Excel for restore: {}", e.getMessage());
            return;
        }
        try {
            Sheet sheet = wb.getSheetAt(0);
            if (!isCurrentMonthSheet(sheet, month, year)) return;

            int rowIdx = findEmployeeRow(sheet, empCode);
            if (rowIdx < 0) return;
            Row row = sheet.getRow(rowIdx);

            int availedCol = leaveTypeName.equalsIgnoreCase("CL") ? COL_CL_AVAILED : COL_PL_AVAILED;
            int openingCol = leaveTypeName.equalsIgnoreCase("CL") ? COL_CL_OPENING : COL_PL_OPENING;
            int addedCol = leaveTypeName.equalsIgnoreCase("CL") ? COL_CL_ADDED : COL_PL_ADDED;
            int afterAddCol = leaveTypeName.equalsIgnoreCase("CL") ? COL_CL_AFTER_ADD : COL_PL_AFTER_ADD;
            int closingCol = leaveTypeName.equalsIgnoreCase("CL") ? COL_CL_CLOSING : COL_PL_CLOSING;

            double currentAvailed = getCellNumericValue(row, availedCol);
            double newAvailed = Math.max(0, currentAvailed - days);
            double opening = getCellNumericValue(row, openingCol);
            double added = getCellNumericValue(row, addedCol);
            double afterAdd = opening + added;
            double closing = afterAdd - newAvailed;

            setCellValue(row, availedCol, newAvailed);
            setCellValue(row, afterAddCol, afterAdd);
            setCellValue(row, closingCol, closing);

            double clAvailed = getCellNumericValue(row, COL_CL_AVAILED);
            double plAvailed = getCellNumericValue(row, COL_PL_AVAILED);
            double lop = getCellNumericValue(row, COL_LOP);
            setCellValue(row, COL_TOTAL_AVAILED, clAvailed + plAvailed + lop);

            try (FileOutputStream fos = new FileOutputStream(EXCEL_PATH)) {
                wb.write(fos);
            }
            log.info("Excel restored for {}: {} availed now {}", empCode, leaveTypeName, newAvailed);

        } catch (IOException e) {
            log.error("Failed to restore Excel for availed leave: {}", e.getMessage());
        } finally {
            try { wb.close(); } catch (IOException e) { /* ignore */ }
        }
    }

    @Transactional
    public void creditMonthlyLeave(int month, int year) {
        log.info("Crediting monthly leave for {}/{}", month, year);

        ensureSheetExistsForMonth(month, year);

        Workbook wb;
        try (FileInputStream fis = new FileInputStream(EXCEL_PATH)) {
            wb = new XSSFWorkbook(fis);
        } catch (IOException e) {
            log.error("Failed to read Excel for credit: {}", e.getMessage());
            return;
        }
        try {
            Sheet sheet = wb.getSheetAt(0);
            if (!isCurrentMonthSheet(sheet, month, year)) return;

            Row firstRow = sheet.getRow(DATA_START_ROW);
            if (firstRow != null && getCellNumericValue(firstRow, COL_CL_ADDED) > 0) {
                log.info("Credit already done for {}/{} (CL added > 0), skipping", month, year);
                return;
            }

            for (int i = DATA_START_ROW; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String code = getCellStringValue(row, COL_EMP_CODE);
                if (code.isBlank()) continue;

                String normCode = normalizeEmpCode(code);
                Optional<Employee> empOpt = employeeRepository.findByEmployeeCode(normCode);
                if (empOpt.isEmpty()) continue;
                Employee emp = empOpt.get();

                if (!isEligibleForCredit(emp)) continue;

                double clAdded = getCellNumericValue(row, COL_CL_ADDED);
                double plAdded = getCellNumericValue(row, COL_PL_ADDED);
                double clOpening = getCellNumericValue(row, COL_CL_OPENING);
                double plOpening = getCellNumericValue(row, COL_PL_OPENING);

                double newClAdded = clAdded + 1.0;
                double newPlAdded = plAdded + 1.5;
                double clAfterAdd = clOpening + newClAdded;
                double plAfterAdd = plOpening + newPlAdded;
                double clAvailed = getCellNumericValue(row, COL_CL_AVAILED);
                double plAvailed = getCellNumericValue(row, COL_PL_AVAILED);

                setCellValue(row, COL_CL_ADDED, newClAdded);
                setCellValue(row, COL_PL_ADDED, newPlAdded);
                setCellValue(row, COL_CL_AFTER_ADD, clAfterAdd);
                setCellValue(row, COL_PL_AFTER_ADD, plAfterAdd);
                setCellValue(row, COL_CL_CLOSING, clAfterAdd - clAvailed);
                setCellValue(row, COL_PL_CLOSING, plAfterAdd - plAvailed);
            }

            try (FileOutputStream fos = new FileOutputStream(EXCEL_PATH)) {
                wb.write(fos);
            }
            log.info("Monthly leave credited successfully for {}/{}", month, year);

        } catch (IOException e) {
            log.error("Failed to credit monthly leave: {}", e.getMessage());
        } finally {
            try { wb.close(); } catch (IOException e) { /* ignore */ }
        }
    }

    private boolean isEligibleForCredit(Employee emp) {
        if (emp.getDoj() == null) return false;
        return ChronoUnit.MONTHS.between(emp.getDoj(), LocalDate.now()) >= 6;
    }

    public void createDefaultSheet(int month, int year) {
        List<Employee> employees = employeeRepository.findAllLiveEmployees();
        if (employees.isEmpty()) employees = employeeRepository.findAll();
        createSheet(employees, month, year);
    }

    private void ensureSheetExistsForMonth(int month, int year) {
        File f = new File(EXCEL_PATH);
        if (!f.exists()) {
            createDefaultSheet(month, year);
            return;
        }
        try (FileInputStream fis = new FileInputStream(EXCEL_PATH);
             Workbook wb = new XSSFWorkbook(fis)) {
            Sheet sheet = wb.getSheetAt(0);
            if (!isCurrentMonthSheet(sheet, month, year)) {
                log.info("Excel sheet is not for {}/{}, creating new sheet", month, year);
                createDefaultSheet(month, year);
            }
        } catch (IOException e) {
            log.warn("Could not check Excel sheet, recreating: {}", e.getMessage());
            createDefaultSheet(month, year);
        }
    }

    private void createSheet(List<Employee> employees, int month, int year) {
        String monthName = LocalDate.of(year, month, 1).format(DateTimeFormatter.ofPattern("MMM''uu"));
        String monthYear = LocalDate.of(year, month, 1).format(DateTimeFormatter.ofPattern("MMMM''uuuu"));
        String prevMonthYear = LocalDate.of(year, month, 1).minusMonths(1)
            .format(DateTimeFormatter.ofPattern("MMM''uu"));

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Sheet1");

            // --- Styles ---
            Font titleFont = wb.createFont();
            titleFont.setFontName("Calibri");
            titleFont.setFontHeightInPoints((short) 14);
            titleFont.setBold(true);
            titleFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle titleStyle = wb.createCellStyle();
            titleStyle.setFont(titleFont);
            titleStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 0x1F, (byte) 0x3D, (byte) 0x6E}, null));
            titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            titleStyle.setBorderBottom(BorderStyle.THIN);
            titleStyle.setBottomBorderColor(IndexedColors.GREY_50_PERCENT.getIndex());

            Font headerFont = wb.createFont();
            headerFont.setFontName("Calibri");
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = wb.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 0x43, (byte) 0x61, (byte) 0xEE}, null));
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setTopBorderColor(IndexedColors.GREY_50_PERCENT.getIndex());
            headerStyle.setBorderBottom(BorderStyle.THICK);
            headerStyle.setBottomBorderColor(IndexedColors.GREY_50_PERCENT.getIndex());
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setLeftBorderColor(IndexedColors.GREY_50_PERCENT.getIndex());
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setRightBorderColor(IndexedColors.GREY_50_PERCENT.getIndex());
            headerStyle.setWrapText(true);

            Font dataFont = wb.createFont();
            dataFont.setFontName("Calibri");
            dataFont.setFontHeightInPoints((short) 11);

            CellStyle dataStyle = wb.createCellStyle();
            dataStyle.setFont(dataFont);
            dataStyle.setAlignment(HorizontalAlignment.CENTER);
            dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setTopBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setLeftBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setRightBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());

            CellStyle altDataStyle = wb.createCellStyle();
            altDataStyle.cloneStyleFrom(dataStyle);
            altDataStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 0xF0, (byte) 0xF4, (byte) 0xFF}, null));
            altDataStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle dataLeftStyle = wb.createCellStyle();
            dataLeftStyle.cloneStyleFrom(dataStyle);
            dataLeftStyle.setAlignment(HorizontalAlignment.LEFT);

            CellStyle altDataLeftStyle = wb.createCellStyle();
            altDataLeftStyle.cloneStyleFrom(altDataStyle);
            altDataLeftStyle.setAlignment(HorizontalAlignment.LEFT);

            // --- Title row ---
            Row titleRow = sheet.createRow(0);
            titleRow.setHeightInPoints(30);
            for (int i = 0; i < 21; i++) {
                Cell c = titleRow.createCell(i);
                c.setCellStyle(titleStyle);
                if (i == 0) c.setCellValue(monthYear);
            }

            // --- Header row ---
            String[] headers = {
                "S No", "Gender", "Emp. Code", "Emp. Name", "Department", "DOJ",
                "Vintage\n(Months)",
                "CL Opening\n(" + prevMonthYear + ")",
                "PL Opening\n(" + prevMonthYear + ")",
                "CL Added\n(" + monthName + ")",
                "PL Added\n(" + monthName + ")",
                "CL After Add\n(" + monthName + ")",
                "PL After Add\n(" + monthName + ")",
                "CL Availed\n(" + monthName + ")",
                "PL Availed\n(" + monthName + ")",
                "LOP",
                "Total Availed",
                "CL Closing\n(" + monthName + ")",
                "PL Closing\n(" + monthName + ")",
                "Last Working\nDay",
                "Remarks"
            };

            Row headerRow = sheet.createRow(HEADER_ROW);
            headerRow.setHeightInPoints(36);
            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }

            // --- Data rows ---
            for (int i = 0; i < employees.size(); i++) {
                Employee emp = employees.get(i);
                Row row = sheet.createRow(DATA_START_ROW + i);
                row.setHeightInPoints(22);
                boolean alt = i % 2 == 1;

                createStyledCell(row, COL_SNO, i + 1, alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_GENDER,
                    emp.getGender() != null ? emp.getGender().substring(0, 1).toUpperCase() : "",
                    alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_EMP_CODE,
                    emp.getEmployeeCode() != null ? emp.getEmployeeCode() : "",
                    alt ? altDataLeftStyle : dataLeftStyle);
                createStyledCell(row, COL_EMP_NAME,
                    emp.getFullName() != null ? emp.getFullName() : "",
                    alt ? altDataLeftStyle : dataLeftStyle);
                createStyledCell(row, COL_DEPT,
                    emp.getProcessAssigned() != null ? emp.getProcessAssigned() : "",
                    alt ? altDataLeftStyle : dataLeftStyle);
                createStyledCell(row, COL_DOJ,
                    emp.getDoj() != null ? emp.getDoj().format(DateTimeFormatter.ofPattern("dd-MM-uuuu")) : "",
                    alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_VINTAGE,
                    emp.getDoj() != null ? ChronoUnit.MONTHS.between(emp.getDoj(), LocalDate.now()) : 0,
                    alt ? altDataStyle : dataStyle);

                createStyledCell(row, COL_CL_OPENING, 0, alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_PL_OPENING, 0, alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_CL_ADDED, 0, alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_PL_ADDED, 0, alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_CL_AFTER_ADD, 0, alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_PL_AFTER_ADD, 0, alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_CL_AVAILED, 0, alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_PL_AVAILED, 0, alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_LOP, 0, alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_TOTAL_AVAILED, 0, alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_CL_CLOSING, 0, alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_PL_CLOSING, 0, alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_LAST_WORKING_DAY, "", alt ? altDataStyle : dataStyle);
                createStyledCell(row, COL_REMARKS, "", alt ? altDataStyle : dataStyle);
            }

            // --- Column widths ---
            int[] widths = { 5, 7, 11, 22, 18, 13, 11, 18, 18, 14, 14, 18, 18, 14, 14, 7, 12, 18, 18, 13, 16 };
            for (int i = 0; i < widths.length; i++) {
                sheet.setColumnWidth(i, widths[i] * 256);
            }
            sheet.setAutoFilter(new CellRangeAddress(HEADER_ROW, employees.size() + HEADER_ROW, 0, headers.length - 1));
            sheet.createFreezePane(0, HEADER_ROW + 1);

            try (FileOutputStream fos = new FileOutputStream(EXCEL_PATH)) {
                wb.write(fos);
            }
            log.info("Excel sheet created for {}/{} with {} employees", month, year, employees.size());

        } catch (IOException e) {
            log.error("Failed to create Excel sheet: {}", e.getMessage());
        }
    }

    private void createStyledCell(Row row, int col, String value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value);
        c.setCellStyle(style);
    }

    private void createStyledCell(Row row, int col, double value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value);
        c.setCellStyle(style);
    }

    public void createSampleSheet(int month, int year) {
        String monthName = LocalDate.of(year, month, 1).format(DateTimeFormatter.ofPattern("MMM''uu"));
        String monthYear = LocalDate.of(year, month, 1).format(DateTimeFormatter.ofPattern("MMMM''uuuu"));
        String prevMonthYear = LocalDate.of(year, month, 1).minusMonths(1)
            .format(DateTimeFormatter.ofPattern("MMM''uu"));

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Sheet1");

            // Same styles as createSheet
            Font titleFont = wb.createFont();
            titleFont.setFontName("Calibri");
            titleFont.setFontHeightInPoints((short) 14);
            titleFont.setBold(true);
            titleFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle titleStyle = wb.createCellStyle();
            titleStyle.setFont(titleFont);
            titleStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 0x1F, (byte) 0x3D, (byte) 0x6E}, null));
            titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            titleStyle.setBorderBottom(BorderStyle.THIN);
            titleStyle.setBottomBorderColor(IndexedColors.GREY_50_PERCENT.getIndex());

            Font headerFont = wb.createFont();
            headerFont.setFontName("Calibri");
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = wb.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 0x43, (byte) 0x61, (byte) 0xEE}, null));
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setTopBorderColor(IndexedColors.GREY_50_PERCENT.getIndex());
            headerStyle.setBorderBottom(BorderStyle.THICK);
            headerStyle.setBottomBorderColor(IndexedColors.GREY_50_PERCENT.getIndex());
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setLeftBorderColor(IndexedColors.GREY_50_PERCENT.getIndex());
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setRightBorderColor(IndexedColors.GREY_50_PERCENT.getIndex());
            headerStyle.setWrapText(true);

            Font dataFont = wb.createFont();
            dataFont.setFontName("Calibri");
            dataFont.setFontHeightInPoints((short) 11);

            CellStyle dataStyle = wb.createCellStyle();
            dataStyle.setFont(dataFont);
            dataStyle.setAlignment(HorizontalAlignment.CENTER);
            dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setTopBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setLeftBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setRightBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());

            CellStyle altDataStyle = wb.createCellStyle();
            altDataStyle.cloneStyleFrom(dataStyle);
            altDataStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 0xF0, (byte) 0xF4, (byte) 0xFF}, null));
            altDataStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle dataLeftStyle = wb.createCellStyle();
            dataLeftStyle.cloneStyleFrom(dataStyle);
            dataLeftStyle.setAlignment(HorizontalAlignment.LEFT);

            CellStyle altDataLeftStyle = wb.createCellStyle();
            altDataLeftStyle.cloneStyleFrom(altDataStyle);
            altDataLeftStyle.setAlignment(HorizontalAlignment.LEFT);

            // Title
            Row titleRow = sheet.createRow(0);
            titleRow.setHeightInPoints(30);
            for (int i = 0; i < 21; i++) {
                Cell c = titleRow.createCell(i);
                c.setCellStyle(titleStyle);
                if (i == 0) c.setCellValue("SAMPLE — " + monthYear);
            }

            // Headers
            String[] headers = {
                "S No", "Gender", "Emp. Code", "Emp. Name", "Department", "DOJ",
                "Vintage\n(Months)",
                "CL Opening\n(" + prevMonthYear + ")",
                "PL Opening\n(" + prevMonthYear + ")",
                "CL Added\n(" + monthName + ")",
                "PL Added\n(" + monthName + ")",
                "CL After Add\n(" + monthName + ")",
                "PL After Add\n(" + monthName + ")",
                "CL Availed\n(" + monthName + ")",
                "PL Availed\n(" + monthName + ")",
                "LOP",
                "Total Availed",
                "CL Closing\n(" + monthName + ")",
                "PL Closing\n(" + monthName + ")",
                "Last Working\nDay",
                "Remarks"
            };

            Row headerRow = sheet.createRow(HEADER_ROW);
            headerRow.setHeightInPoints(36);
            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }

            // Sample row
            Row sample = sheet.createRow(DATA_START_ROW);
            sample.setHeightInPoints(22);
            createStyledCell(sample, COL_SNO, 1, dataStyle);
            createStyledCell(sample, COL_GENDER, "M", dataStyle);
            createStyledCell(sample, COL_EMP_CODE, "PARI001", dataLeftStyle);
            createStyledCell(sample, COL_EMP_NAME, "John Doe (Sample)", dataLeftStyle);
            createStyledCell(sample, COL_DEPT, "IT", dataLeftStyle);
            createStyledCell(sample, COL_DOJ, "01-01-" + (year - 2), dataStyle);
            createStyledCell(sample, COL_VINTAGE, 24.0, dataStyle);
            createStyledCell(sample, COL_CL_OPENING, 5.0, dataStyle);
            createStyledCell(sample, COL_PL_OPENING, 8.0, dataStyle);
            createStyledCell(sample, COL_CL_ADDED, 1.0, dataStyle);
            createStyledCell(sample, COL_PL_ADDED, 1.5, dataStyle);
            createStyledCell(sample, COL_CL_AFTER_ADD, 6.0, dataStyle);
            createStyledCell(sample, COL_PL_AFTER_ADD, 9.5, dataStyle);
            createStyledCell(sample, COL_CL_AVAILED, 2.0, dataStyle);
            createStyledCell(sample, COL_PL_AVAILED, 1.0, dataStyle);
            createStyledCell(sample, COL_LOP, 0, dataStyle);
            createStyledCell(sample, COL_TOTAL_AVAILED, 3.0, dataStyle);
            createStyledCell(sample, COL_CL_CLOSING, 4.0, dataStyle);
            createStyledCell(sample, COL_PL_CLOSING, 8.5, dataStyle);
            createStyledCell(sample, COL_LAST_WORKING_DAY, "", dataStyle);
            createStyledCell(sample, COL_REMARKS, "Sample record", dataStyle);

            // Column widths
            int[] widths = { 5, 7, 11, 22, 18, 13, 11, 18, 18, 14, 14, 18, 18, 14, 14, 7, 13, 18, 18, 13, 16 };
            for (int i = 0; i < widths.length; i++) {
                sheet.setColumnWidth(i, widths[i] * 256);
            }
            sheet.setAutoFilter(new CellRangeAddress(HEADER_ROW, DATA_START_ROW, 0, headers.length - 1));
            sheet.createFreezePane(0, HEADER_ROW + 1);

            String tmpPath = EXCEL_PATH.replace(".xlsx", "_sample.xlsx");
            try (FileOutputStream fos = new FileOutputStream(tmpPath)) {
                wb.write(fos);
            }
            log.info("Sample Excel created at {}", tmpPath);

        } catch (IOException e) {
            log.error("Failed to create sample Excel: {}", e.getMessage());
        }
    }

    private int findEmployeeRow(Sheet sheet, String empCode) {
        String normCode = normalizeEmpCode(empCode);
        for (int i = DATA_START_ROW; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;
            String cellCode = getCellStringValue(row, COL_EMP_CODE);
            if (cellCode.isBlank()) continue;
            if (normalizeEmpCode(cellCode).equals(normCode)) {
                return i;
            }
        }
        return -1;
    }

    private boolean isCurrentMonthSheet(Sheet sheet, int month, int year) {
        Row titleRow = sheet.getRow(TITLE_ROW);
        if (titleRow == null) return false;
        String monthName = LocalDate.of(year, month, 1).format(DateTimeFormatter.ofPattern("MMMM''uuuu"));
        String cellVal = getCellStringValue(titleRow, 0);
        return cellVal.contains(monthName) || cellVal.contains(String.valueOf(year));
    }

    private void saveExcel() {
        // no-op: changes are already in-memory; caller should manage persistence
    }
}
