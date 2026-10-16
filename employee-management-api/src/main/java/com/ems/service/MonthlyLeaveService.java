package com.ems.service;

import com.ems.dto.MonthlyLeaveBalanceDTO;
import com.ems.model.Employee;
import com.ems.model.LeaveBalance;
import com.ems.model.LeaveType;
import com.ems.model.MonthlyLeaveBalance;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.LeaveBalanceRepository;
import com.ems.repository.LeaveTypeRepository;
import com.ems.repository.MonthlyLeaveBalanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MonthlyLeaveService {

    private final MonthlyLeaveBalanceRepository monthlyLeaveBalanceRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;

    @Transactional
    public synchronized List<MonthlyLeaveBalanceDTO> getMonthlyBalances(int year, int month) {
        List<MonthlyLeaveBalance> existing = monthlyLeaveBalanceRepository.findByYearAndMonthWithEmployee(year, month);
        List<Employee> allEmployees = employeeRepository.findAllLiveEmployees();
        if (allEmployees.isEmpty()) {
            allEmployees = employeeRepository.findAll();
        }

        Set<Long> existingEmpIds = existing.stream()
                .map(m -> m.getEmployee().getId())
                .collect(Collectors.toCollection(HashSet::new));

        boolean hasNew = false;
        for (Employee emp : allEmployees) {
            if (emp != null && emp.getId() != null && !existingEmpIds.contains(emp.getId())) {
                existingEmpIds.add(emp.getId());
                Optional<MonthlyLeaveBalance> already = monthlyLeaveBalanceRepository.findByEmployeeIdAndYearAndMonth(emp.getId(), year, month);
                if (already.isPresent()) {
                    existing.add(already.get());
                } else {
                    MonthlyLeaveBalance newRecord = initializeRecordForEmployee(emp, year, month);
                    monthlyLeaveBalanceRepository.save(newRecord);
                    existing.add(newRecord);
                    hasNew = true;
                }
            }
        }

        if (hasNew) {
            monthlyLeaveBalanceRepository.flush();
            existing = monthlyLeaveBalanceRepository.findByYearAndMonthWithEmployee(year, month);
        }

        return existing.stream()
                .map(MonthlyLeaveBalanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    private MonthlyLeaveBalance initializeRecordForEmployee(Employee emp, int year, int month) {
        List<MonthlyLeaveBalance> prevList = monthlyLeaveBalanceRepository.findPreviousMonths(emp.getId(), year, month);

        double clOpen = 0.0;
        double plOpen = 0.0;

        if (!prevList.isEmpty()) {
            MonthlyLeaveBalance prev = prevList.get(0);
            clOpen = prev.getClClosing() != null ? prev.getClClosing() : 0.0;
            plOpen = prev.getPlClosing() != null ? prev.getPlClosing() : 0.0;
        } else {
            // Check yearly leave balances as fallback
            try {
                List<LeaveBalance> ybList = leaveBalanceRepository.findByEmployeeIdAndYear(emp.getId(), year);
                for (LeaveBalance yb : ybList) {
                    if (yb.getLeaveType() != null && "CL".equalsIgnoreCase(yb.getLeaveType().getName())) {
                        clOpen = yb.getBalance() != null ? yb.getBalance().doubleValue() : 0.0;
                    } else if (yb.getLeaveType() != null && "PL".equalsIgnoreCase(yb.getLeaveType().getName())) {
                        plOpen = yb.getBalance() != null ? yb.getBalance().doubleValue() : 0.0;
                    }
                }
            } catch (Exception ignored) {}
        }

        // Credit policy: 1 CL and 1.5 PL per month
        double clAdd = 1.0;
        double plAdd = 1.5;

        MonthlyLeaveBalance record = MonthlyLeaveBalance.builder()
                .employee(emp)
                .year(year)
                .month(month)
                .clOpening(clOpen)
                .plOpening(plOpen)
                .clAdded(clAdd)
                .plAdded(plAdd)
                .clAvailed(0.0)
                .plAvailed(0.0)
                .lop(0.0)
                .lastWorkingDay("")
                .remarks("")
                .build();

        record.calculateValues();
        return record;
    }

    @Transactional
    public List<MonthlyLeaveBalanceDTO> batchUpdate(List<MonthlyLeaveBalanceDTO> dtoList) {
        if (dtoList == null || dtoList.isEmpty()) return Collections.emptyList();

        List<MonthlyLeaveBalance> updatedList = new ArrayList<>();

        for (MonthlyLeaveBalanceDTO dto : dtoList) {
            Optional<MonthlyLeaveBalance> opt = Optional.empty();
            if (dto.getId() != null) {
                opt = monthlyLeaveBalanceRepository.findById(dto.getId());
            } else if (dto.getEmployeeId() != null && dto.getYear() != null && dto.getMonth() != null) {
                opt = monthlyLeaveBalanceRepository.findByEmployeeIdAndYearAndMonth(dto.getEmployeeId(), dto.getYear(), dto.getMonth());
            }

            if (opt.isPresent()) {
                MonthlyLeaveBalance entity = opt.get();
                if (dto.getClOpening() != null) entity.setClOpening(dto.getClOpening());
                if (dto.getPlOpening() != null) entity.setPlOpening(dto.getPlOpening());
                if (dto.getClAdded() != null) entity.setClAdded(dto.getClAdded());
                if (dto.getPlAdded() != null) entity.setPlAdded(dto.getPlAdded());
                if (dto.getClAvailed() != null) entity.setClAvailed(dto.getClAvailed());
                if (dto.getPlAvailed() != null) entity.setPlAvailed(dto.getPlAvailed());
                if (dto.getLop() != null) entity.setLop(dto.getLop());
                if (dto.getLastWorkingDay() != null) entity.setLastWorkingDay(dto.getLastWorkingDay());
                if (dto.getRemarks() != null) entity.setRemarks(dto.getRemarks());

                entity.calculateValues();
                updatedList.add(monthlyLeaveBalanceRepository.save(entity));
            }
        }

        monthlyLeaveBalanceRepository.flush();

        return updatedList.stream()
                .map(MonthlyLeaveBalanceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public byte[] exportToExcel(int year, int month) throws IOException {
        List<MonthlyLeaveBalance> records = monthlyLeaveBalanceRepository.findByYearAndMonthWithEmployee(year, month);
        if (records.isEmpty()) {
            getMonthlyBalances(year, month);
            records = monthlyLeaveBalanceRepository.findByYearAndMonthWithEmployee(year, month);
        }

        LocalDate currentDate = LocalDate.of(year, month, 1);
        String currentMonthName = currentDate.format(DateTimeFormatter.ofPattern("MMM''uu"));
        String prevMonthName = currentDate.minusMonths(1).format(DateTimeFormatter.ofPattern("MMM''uu"));

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Leave Register - " + currentMonthName);

            // --- Custom Styles matching image exactly ---
            // Main Top Green Header
            Font headerFont = wb.createFont();
            headerFont.setFontName("Calibri");
            headerFont.setFontHeightInPoints((short) 10);
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle greenHeaderStyle = wb.createCellStyle();
            greenHeaderStyle.setFont(headerFont);
            greenHeaderStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 0x00, (byte) 0x80, (byte) 0x00}, null));
            greenHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            greenHeaderStyle.setAlignment(HorizontalAlignment.CENTER);
            greenHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            greenHeaderStyle.setWrapText(true);
            setAllBorders(greenHeaderStyle, BorderStyle.THIN, IndexedColors.WHITE);

            // Red Header for "After Adding"
            CellStyle redHeaderStyle = wb.createCellStyle();
            redHeaderStyle.setFont(headerFont);
            redHeaderStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 0xB3, (byte) 0x00, (byte) 0x00}, null));
            redHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            redHeaderStyle.setAlignment(HorizontalAlignment.CENTER);
            redHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            redHeaderStyle.setWrapText(true);
            setAllBorders(redHeaderStyle, BorderStyle.THIN, IndexedColors.WHITE);

            // Red Data Cells
            Font whiteBoldFont = wb.createFont();
            whiteBoldFont.setFontName("Calibri");
            whiteBoldFont.setFontHeightInPoints((short) 10);
            whiteBoldFont.setBold(true);
            whiteBoldFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle redDataStyle = wb.createCellStyle();
            redDataStyle.setFont(whiteBoldFont);
            redDataStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 0xB3, (byte) 0x00, (byte) 0x00}, null));
            redDataStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            redDataStyle.setAlignment(HorizontalAlignment.CENTER);
            redDataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setAllBorders(redDataStyle, BorderStyle.THIN, IndexedColors.GREY_25_PERCENT);

            // Blue Data Cells for LOP
            CellStyle blueDataStyle = wb.createCellStyle();
            blueDataStyle.setFont(whiteBoldFont);
            blueDataStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 0x1E, (byte) 0x3A, (byte) 0x8A}, null));
            blueDataStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            blueDataStyle.setAlignment(HorizontalAlignment.CENTER);
            blueDataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setAllBorders(blueDataStyle, BorderStyle.THIN, IndexedColors.GREY_25_PERCENT);

            // Pink Data Cell for LOP > 0
            Font pinkTextFont = wb.createFont();
            pinkTextFont.setFontName("Calibri");
            pinkTextFont.setFontHeightInPoints((short) 10);
            pinkTextFont.setBold(true);
            pinkTextFont.setColor(IndexedColors.DARK_RED.getIndex());

            CellStyle pinkDataStyle = wb.createCellStyle();
            pinkDataStyle.setFont(pinkTextFont);
            pinkDataStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 0xFE, (byte) 0xCD, (byte) 0xD3}, null));
            pinkDataStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            pinkDataStyle.setAlignment(HorizontalAlignment.CENTER);
            pinkDataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setAllBorders(pinkDataStyle, BorderStyle.THIN, IndexedColors.GREY_25_PERCENT);

            // Green Data Cells for Final Leave Balances
            CellStyle greenDataStyle = wb.createCellStyle();
            greenDataStyle.setFont(whiteBoldFont);
            greenDataStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 0x16, (byte) 0xA3, (byte) 0x4A}, null));
            greenDataStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            greenDataStyle.setAlignment(HorizontalAlignment.CENTER);
            greenDataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setAllBorders(greenDataStyle, BorderStyle.THIN, IndexedColors.GREY_25_PERCENT);

            // Vintage Shaded Cell Style
            Font vintageFont = wb.createFont();
            vintageFont.setFontName("Calibri");
            vintageFont.setFontHeightInPoints((short) 10);
            vintageFont.setBold(true);

            CellStyle vintageStyle = wb.createCellStyle();
            vintageStyle.setFont(vintageFont);
            vintageStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 0xEB, (byte) 0xF4, (byte) 0xF6}, null));
            vintageStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            vintageStyle.setAlignment(HorizontalAlignment.CENTER);
            vintageStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setAllBorders(vintageStyle, BorderStyle.THIN, IndexedColors.GREY_25_PERCENT);

            // Standard Data Cells
            Font normalFont = wb.createFont();
            normalFont.setFontName("Calibri");
            normalFont.setFontHeightInPoints((short) 10);

            CellStyle normalCenterStyle = wb.createCellStyle();
            normalCenterStyle.setFont(normalFont);
            normalCenterStyle.setAlignment(HorizontalAlignment.CENTER);
            normalCenterStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setAllBorders(normalCenterStyle, BorderStyle.THIN, IndexedColors.GREY_25_PERCENT);

            CellStyle normalLeftStyle = wb.createCellStyle();
            normalLeftStyle.setFont(normalFont);
            normalLeftStyle.setAlignment(HorizontalAlignment.LEFT);
            normalLeftStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setAllBorders(normalLeftStyle, BorderStyle.THIN, IndexedColors.GREY_25_PERCENT);

            Font boldNormalFont = wb.createFont();
            boldNormalFont.setFontName("Calibri");
            boldNormalFont.setFontHeightInPoints((short) 10);
            boldNormalFont.setBold(true);

            CellStyle boldCenterStyle = wb.createCellStyle();
            boldCenterStyle.setFont(boldNormalFont);
            boldCenterStyle.setAlignment(HorizontalAlignment.CENTER);
            boldCenterStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setAllBorders(boldCenterStyle, BorderStyle.THIN, IndexedColors.GREY_25_PERCENT);

            // Header row creation
            String[] headers = {
                    "S No",
                    "Gender",
                    "Emp.Code",
                    "Emp.Name",
                    "Department",
                    "Doj",
                    "Vintage in\nMonths",
                    "CL Leave\nBalance as\non " + prevMonthName,
                    "PL Leave\nBalance as\non " + prevMonthName,
                    "CL added\nin " + currentMonthName,
                    "PL added\nin " + currentMonthName,
                    "After\nAdding CL\nleave\nbalance as\non " + currentMonthName,
                    "After\nAdding PL\nleave\nbalance as\non " + currentMonthName,
                    "CL Availed\nin " + currentMonthName,
                    "PL Availed\nin " + currentMonthName,
                    "LOP",
                    "Total\nleave\nAvailed",
                    "CL Leave\nBalance as\non " + currentMonthName,
                    "Final PL\nLeave\nBalance as\non " + currentMonthName,
                    "Last Working\nDay",
                    "Remarks"
            };

            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(48);

            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                if (i == 11 || i == 12) {
                    c.setCellStyle(redHeaderStyle);
                } else {
                    c.setCellStyle(greenHeaderStyle);
                }
            }

            // Data rows
            int rowIdx = 1;
            for (MonthlyLeaveBalance b : records) {
                Employee emp = b.getEmployee();
                Row row = sheet.createRow(rowIdx++);
                row.setHeightInPoints(20);

                String gender = emp != null && emp.getGender() != null && !emp.getGender().isEmpty()
                        ? emp.getGender().substring(0, 1).toUpperCase() : "";
                String empCode = emp != null && emp.getEmployeeCode() != null ? emp.getEmployeeCode() : "";
                String empName = emp != null && emp.getFullName() != null ? emp.getFullName() : "";
                String dept = emp != null && emp.getProcessAssigned() != null && !emp.getProcessAssigned().isBlank()
                        ? emp.getProcessAssigned()
                        : (emp != null && emp.getDepartment() != null ? emp.getDepartment() : "");
                String doj = emp != null && emp.getDoj() != null ? emp.getDoj().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) : "";

                long vintage = 0;
                if (emp != null && emp.getDoj() != null) {
                    vintage = Math.max(0, ChronoUnit.MONTHS.between(emp.getDoj().withDayOfMonth(1), currentDate));
                }

                writeCell(row, 0, (rowIdx - 1), normalCenterStyle);
                writeCell(row, 1, gender, normalCenterStyle);
                writeCell(row, 2, empCode, normalLeftStyle);
                writeCell(row, 3, empName, normalLeftStyle);
                writeCell(row, 4, dept, normalLeftStyle);
                writeCell(row, 5, doj, normalCenterStyle);
                writeCell(row, 6, vintage, vintageStyle);

                writeNumberCell(row, 7, b.getClOpening(), normalCenterStyle);
                writeNumberCell(row, 8, b.getPlOpening(), normalCenterStyle);
                writeNumberCell(row, 9, b.getClAdded(), normalCenterStyle);
                writeNumberCell(row, 10, b.getPlAdded(), normalCenterStyle);

                writeNumberCell(row, 11, b.getClAfterAdd(), redDataStyle);
                writeNumberCell(row, 12, b.getPlAfterAdd(), redDataStyle);

                writeNumberCell(row, 13, b.getClAvailed(), normalCenterStyle);
                writeNumberCell(row, 14, b.getPlAvailed(), normalCenterStyle);

                double lopVal = b.getLop() != null ? b.getLop() : 0.0;
                if (lopVal > 0) {
                    writeNumberCell(row, 15, lopVal, pinkDataStyle);
                } else {
                    writeNumberCell(row, 15, lopVal, blueDataStyle);
                }

                writeNumberCell(row, 16, b.getTotalAvailed(), boldCenterStyle);

                writeNumberCell(row, 17, b.getClClosing(), greenDataStyle);
                writeNumberCell(row, 18, b.getPlClosing(), greenDataStyle);

                writeCell(row, 19, b.getLastWorkingDay() != null ? b.getLastWorkingDay() : "", normalCenterStyle);
                writeCell(row, 20, b.getRemarks() != null ? b.getRemarks() : "", normalLeftStyle);
            }

            int[] colWidths = { 6, 7, 12, 22, 16, 12, 10, 12, 12, 10, 10, 14, 14, 11, 11, 8, 11, 13, 14, 13, 16 };
            for (int i = 0; i < colWidths.length; i++) {
                sheet.setColumnWidth(i, colWidths[i] * 256);
            }

            sheet.createFreezePane(0, 1);
            if (rowIdx > 1) {
                sheet.setAutoFilter(new CellRangeAddress(0, rowIdx - 1, 0, headers.length - 1));
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            wb.write(baos);
            return baos.toByteArray();
        }
    }

    public byte[] generateSampleExcel(int year, int month) throws IOException {
        List<MonthlyLeaveBalance> records = monthlyLeaveBalanceRepository.findByYearAndMonthWithEmployee(year, month);
        if (records.isEmpty()) {
            getMonthlyBalances(year, month);
        }
        return exportToExcel(year, month);
    }

    @Transactional
    public Map<String, Object> importFromExcel(MultipartFile file, int year, int month) throws IOException {
        int imported = 0;
        int updated = 0;
        List<String> errors = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook wb = WorkbookFactory.create(is)) {
            Sheet sheet = wb.getSheetAt(0);

            int headerRowIdx = findHeaderRow(sheet);
            if (headerRowIdx == -1) {
                errors.add("Could not find table header row in Excel file.");
                return Map.of("imported", 0, "updated", 0, "errors", errors);
            }

            Row headerRow = sheet.getRow(headerRowIdx);
            Map<String, Integer> colMap = new HashMap<>();
            for (int c = 0; c < headerRow.getLastCellNum(); c++) {
                Cell cell = headerRow.getCell(c);
                if (cell != null) {
                    String val = cell.getStringCellValue().replaceAll("\\s+", " ").trim().toLowerCase();
                    colMap.put(val, c);
                }
            }

            int colEmpCode = findColumnIndex(colMap, "emp.code", "emp code", "code", "empcode");
            int colClOpen = findColumnIndex(colMap, "cl leave balance", "cl opening", "cl open");
            int colPlOpen = findColumnIndex(colMap, "pl leave balance", "pl opening", "pl open");
            int colClAdd = findColumnIndex(colMap, "cl added", "cl add");
            int colPlAdd = findColumnIndex(colMap, "pl added", "pl add");
            int colClAvail = findColumnIndex(colMap, "cl availed", "cl avail");
            int colPlAvail = findColumnIndex(colMap, "pl availed", "pl avail");
            int colLop = findColumnIndex(colMap, "lop", "loss of pay");
            int colLwd = findColumnIndex(colMap, "last working day", "lwd", "last working");
            int colRemarks = findColumnIndex(colMap, "remarks", "remark", "notes");

            if (colEmpCode == -1) {
                // Fallback to fixed column index 2
                colEmpCode = 2;
            }
            if (colClOpen == -1) colClOpen = 7;
            if (colPlOpen == -1) colPlOpen = 8;
            if (colClAdd == -1) colClAdd = 9;
            if (colPlAdd == -1) colPlAdd = 10;
            if (colClAvail == -1) colClAvail = 13;
            if (colPlAvail == -1) colPlAvail = 14;
            if (colLop == -1) colLop = 15;
            if (colLwd == -1) colLwd = 19;
            if (colRemarks == -1) colRemarks = 20;

            for (int r = headerRowIdx + 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                String empCode = getCellString(row.getCell(colEmpCode));
                if (empCode == null || empCode.isBlank()) continue;

                String normCode = empCode.trim().toUpperCase();
                Optional<Employee> empOpt = employeeRepository.findByEmployeeCode(normCode);
                if (empOpt.isEmpty()) {
                    // Try without leading zeros or with standard prefix
                    normCode = normalizeCode(normCode);
                    empOpt = employeeRepository.findByEmployeeCode(normCode);
                }

                if (empOpt.isEmpty()) {
                    errors.add("Row " + (r + 1) + ": Employee not found for code '" + empCode + "'");
                    continue;
                }

                Employee emp = empOpt.get();
                MonthlyLeaveBalance record = monthlyLeaveBalanceRepository
                        .findByEmployeeIdAndYearAndMonth(emp.getId(), year, month)
                        .orElseGet(() -> MonthlyLeaveBalance.builder()
                                .employee(emp)
                                .year(year)
                                .month(month)
                                .build());

                boolean isNew = record.getId() == null;

                Double clOpen = getCellNumeric(row.getCell(colClOpen));
                Double plOpen = getCellNumeric(row.getCell(colPlOpen));
                Double clAdd = getCellNumeric(row.getCell(colClAdd));
                Double plAdd = getCellNumeric(row.getCell(colPlAdd));
                Double clAvail = getCellNumeric(row.getCell(colClAvail));
                Double plAvail = getCellNumeric(row.getCell(colPlAvail));
                Double lop = getCellNumeric(row.getCell(colLop));
                String lwd = getCellString(row.getCell(colLwd));
                String remarks = getCellString(row.getCell(colRemarks));

                if (clOpen != null) record.setClOpening(clOpen);
                if (plOpen != null) record.setPlOpening(plOpen);
                if (clAdd != null) record.setClAdded(clAdd);
                if (plAdd != null) record.setPlAdded(plAdd);
                if (clAvail != null) record.setClAvailed(clAvail);
                if (plAvail != null) record.setPlAvailed(plAvail);
                if (lop != null) record.setLop(lop);
                if (lwd != null) record.setLastWorkingDay(lwd);
                if (remarks != null) record.setRemarks(remarks);

                record.calculateValues();
                monthlyLeaveBalanceRepository.save(record);

                if (isNew) imported++; else updated++;
            }
        }

        return Map.of("imported", imported, "updated", updated, "errors", errors);
    }

    private int findHeaderRow(Sheet sheet) {
        for (int r = 0; r <= Math.min(5, sheet.getLastRowNum()); r++) {
            Row row = sheet.getRow(r);
            if (row == null) continue;
            for (int c = 0; c < row.getLastCellNum(); c++) {
                Cell cell = row.getCell(c);
                if (cell != null && cell.getCellType() == CellType.STRING) {
                    String str = cell.getStringCellValue().toLowerCase();
                    if (str.contains("emp.code") || str.contains("emp code") || str.contains("gender")) {
                        return r;
                    }
                }
            }
        }
        return -1;
    }

    private int findColumnIndex(Map<String, Integer> colMap, String... matches) {
        for (Map.Entry<String, Integer> entry : colMap.entrySet()) {
            for (String m : matches) {
                if (entry.getKey().contains(m)) {
                    return entry.getValue();
                }
            }
        }
        return -1;
    }

    private String normalizeCode(String code) {
        if (code == null) return "";
        String clean = code.replaceAll("[^a-zA-Z0-9]", "");
        String digits = clean.replaceAll("[^0-9]", "");
        String alpha = clean.replaceAll("[0-9]", "");
        if (digits.isEmpty()) return clean.toUpperCase();
        return alpha.toUpperCase() + String.format("%04d", Integer.parseInt(digits));
    }

    private void writeCell(Row row, int col, Object val, CellStyle style) {
        Cell cell = row.createCell(col);
        if (val instanceof Number) {
            cell.setCellValue(((Number) val).doubleValue());
        } else {
            cell.setCellValue(val != null ? val.toString() : "");
        }
        cell.setCellStyle(style);
    }

    private void writeNumberCell(Row row, int col, Double val, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(val != null ? val : 0.0);
        cell.setCellStyle(style);
    }

    private void setAllBorders(CellStyle style, BorderStyle bs, IndexedColors color) {
        style.setBorderTop(bs);
        style.setTopBorderColor(color.getIndex());
        style.setBorderBottom(bs);
        style.setBottomBorderColor(color.getIndex());
        style.setBorderLeft(bs);
        style.setLeftBorderColor(color.getIndex());
        style.setBorderRight(bs);
        style.setRightBorderColor(color.getIndex());
    }

    private String getCellString(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                if (DateUtil.isCellDateFormatted(cell)) {
                    LocalDate ld = cell.getLocalDateTimeCellValue().toLocalDate();
                    yield ld.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                }
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private Double getCellNumeric(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case NUMERIC -> cell.getNumericCellValue();
            case STRING -> {
                try {
                    yield Double.parseDouble(cell.getStringCellValue().trim());
                } catch (Exception e) {
                    yield null;
                }
            }
            default -> null;
        };
    }
}
