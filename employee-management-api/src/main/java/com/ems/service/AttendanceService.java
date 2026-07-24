package com.ems.service;

import com.ems.dto.*;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.AttendanceRecord;
import com.ems.model.CompOff;
import com.ems.model.Employee;
import com.ems.model.Holiday;
import com.ems.repository.AttendanceRepository;
import com.ems.repository.CompOffRepository;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final HolidayRepository holidayRepository;
    private final CompOffRepository compOffRepository;

    public MonthlyAttendanceDTO getMonthlyAttendance(LocalDate fromDate, LocalDate toDate, int page, int size, String department) {
        return buildGrid(fromDate, toDate, page, size, department);
    }

    public List<String> getDepartments() {
        return employeeRepository.findDistinctDepartments();
    }

    private MonthlyAttendanceDTO buildGrid(LocalDate monthStart, LocalDate monthEnd, int page, int size, String department) {
        int numDays = (int) ChronoUnit.DAYS.between(monthStart, monthEnd) + 1;

        List<DayColumnDTO> dayColumns = new ArrayList<>();
        for (int i = 0; i < numDays; i++) {
            LocalDate d = monthStart.plusDays(i);
            dayColumns.add(DayColumnDTO.builder()
                .date(d.toString())
                .dayOfWeek(d.getDayOfWeek().name().substring(0, 1).toUpperCase() +
                    d.getDayOfWeek().name().substring(1, 3).toLowerCase())
                .dayNumber(d.getDayOfMonth())
                .build());
        }

        boolean hasDeptFilter = department != null && !department.trim().isEmpty();
        int totalEmployees;
        List<Employee> employees;
        if (hasDeptFilter) {
            totalEmployees = (int) employeeRepository.countByDepartmentAndIsDeletedFalse(department.trim());
            employees = employeeRepository.findByDepartmentAndIsDeletedFalse(department.trim(), PageRequest.of(page, size));
        } else {
            totalEmployees = (int) employeeRepository.count();
            employees = employeeRepository.findAll(PageRequest.of(page, size)).getContent();
        }

        List<AttendanceRecord> allRecords = attendanceRepository.findByAttendanceDateBetween(monthStart, monthEnd);

        int[] presentCounts = new int[numDays];
        int[] leaveCounts = new int[numDays];
        int[] mlCounts = new int[numDays];
        int[] resignCounts = new int[numDays];

        Map<Long, Map<Integer, String>> recordMap = new HashMap<>();
        for (AttendanceRecord r : allRecords) {
            int dayIndex = (int) ChronoUnit.DAYS.between(monthStart, r.getAttendanceDate());
            if (dayIndex < 0 || dayIndex >= numDays) continue;
            recordMap.computeIfAbsent(r.getEmployee().getId(), k -> new HashMap<>())
                .put(dayIndex, r.getStatus());
            switch (r.getStatus()) {
                case "P" -> presentCounts[dayIndex]++;
                case "L" -> leaveCounts[dayIndex]++;
                case "ML" -> mlCounts[dayIndex]++;
                case "R" -> resignCounts[dayIndex]++;
            }
        }

        List<SummaryRowDTO> summaryRows = new ArrayList<>();
        summaryRows.add(makeSummary("Present", presentCounts));
        summaryRows.add(makeSummary("Leaves", leaveCounts));
        summaryRows.add(makeSummary("ML", mlCounts));
        summaryRows.add(makeSummary("Resigns", resignCounts));
        List<Integer> staffCounts = java.util.stream.IntStream.range(0, numDays).map(i -> totalEmployees).boxed().collect(java.util.stream.Collectors.toList());
        summaryRows.add(SummaryRowDTO.builder().label("Total Live Staff").dailyCounts(staffCounts).total(totalEmployees).build());

        List<EmployeeAttendanceDTO> employeeDTOs = new ArrayList<>();
        int serialNo = page * size + 1;
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        for (Employee emp : employees) {
            Map<Integer, String> empDayMap = recordMap.getOrDefault(emp.getId(), new HashMap<>());
            List<String> days = new ArrayList<>();
            int p = 0, l = 0, ml = 0, r = 0;
            for (int i = 0; i < numDays; i++) {
                String status = empDayMap.getOrDefault(i, "");
                days.add(status);
                switch (status) {
                    case "P" -> p++;
                    case "L" -> l++;
                    case "ML" -> ml++;
                    case "R" -> r++;
                }
            }
            long vintage = emp.getDoj() != null ? ChronoUnit.MONTHS.between(emp.getDoj(), monthEnd) : 0;

            employeeDTOs.add(EmployeeAttendanceDTO.builder()
                .serialNo(serialNo++)
                .employeeId(emp.getId())
                .employeeCode(emp.getEmployeeCode())
                .employeeName(emp.getFullName())
                .gender(emp.getGender())
                .department(emp.getDepartment() != null ? emp.getDepartment() : "")
                .designation(emp.getDesignation())
                .doj(emp.getDoj() != null ? emp.getDoj().format(dateFormatter) : "")
                .vintage(vintage)
                .days(days)
                .totalPresent(p)
                .totalLeave(l)
                .totalML(ml)
                .totalResign(r)
                .build());
        }

        return MonthlyAttendanceDTO.builder()
            .fromDate(monthStart.toString())
            .toDate(monthEnd.toString())
            .totalEmployees(totalEmployees)
            .page(page)
            .size(size)
            .dayColumns(dayColumns)
            .summaryRows(summaryRows)
            .employees(employeeDTOs)
            .build();
    }

    private SummaryRowDTO makeSummary(String label, int[] counts) {
        int total = 0;
        List<Integer> list = new ArrayList<>();
        for (int c : counts) { list.add(c); total += c; }
        return SummaryRowDTO.builder().label(label).dailyCounts(list).total(total).build();
    }

    @Transactional
    public void bulkUpsert(List<AttendanceDTO> records) {
        List<CompOff> earnedCompOffs = new ArrayList<>();
        for (AttendanceDTO dto : records) {
            if (dto.getStatus() == null || dto.getStatus().isBlank()) continue;
            Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + dto.getEmployeeId()));
            AttendanceRecord record = attendanceRepository
                .findByEmployeeIdAndAttendanceDate(dto.getEmployeeId(), dto.getDate())
                .orElseGet(() -> AttendanceRecord.builder()
                    .employee(employee)
                    .attendanceDate(dto.getDate())
                    .build());
            record.setStatus(dto.getStatus());
            record.setEmployee(employee);
            attendanceRepository.save(record);

            if ("P".equals(dto.getStatus()) && isHolidayOrWeekOff(dto.getDate())) {
                if (!compOffRepository.existsByEmployeeIdAndEarnedDateAndStatus(employee.getId(), dto.getDate(), "EARNED")) {
                    CompOff co = CompOff.builder()
                        .employee(employee)
                        .earnedDate(dto.getDate())
                        .expiryDate(dto.getDate().plusMonths(3))
                        .status("EARNED")
                        .remarks("Auto-earned: Worked on holiday/week-off")
                        .build();
                    earnedCompOffs.add(compOffRepository.save(co));
                }
            }
        }
        if (!earnedCompOffs.isEmpty()) {
            log.info("Auto-earned {} Comp-Off(s) for working on holidays/week-offs", earnedCompOffs.size());
        }
        log.info("Attendance bulk upsert: {} records", records.size());
    }

    private boolean isHolidayOrWeekOff(LocalDate date) {
        if (holidayRepository.existsByDate(date)) return true;
        return date.getDayOfWeek() == DayOfWeek.SUNDAY;
    }

    public byte[] exportExcel(LocalDate fromDate, LocalDate toDate) {
        MonthlyAttendanceDTO data = buildGrid(fromDate, toDate, 0, Integer.MAX_VALUE, null);
        int numDays = data.getDayColumns().size();

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Attendance");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setAlignment(HorizontalAlignment.CENTER);
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            int totalCols = 7 + numDays + 4;

            Row header1 = sheet.createRow(0);
            String[] empHeaders = {"S No", "Gender", "EmpCode", "Employee Name", "Department", "DOJ", "Vintage"};
            for (int i = 0; i < empHeaders.length; i++) {
                Cell c = header1.createCell(i);
                c.setCellValue(empHeaders[i]);
                c.setCellStyle(headerStyle);
            }
            for (int i = 0; i < numDays; i++) {
                Cell c = header1.createCell(7 + i);
                c.setCellValue(data.getDayColumns().get(i).getDayOfWeek());
                c.setCellStyle(headerStyle);
            }
            String[] summaryHeaders = {"Total P", "Leaves", "Total ML", "Total Leaves"};
            for (int i = 0; i < summaryHeaders.length; i++) {
                Cell c = header1.createCell(7 + numDays + i);
                c.setCellValue(summaryHeaders[i]);
                c.setCellStyle(headerStyle);
            }

            Row header2 = sheet.createRow(1);
            for (int i = 0; i < empHeaders.length; i++) {
                Cell c = header2.createCell(i);
                c.setCellValue("");
                c.setCellStyle(headerStyle);
            }
            for (int i = 0; i < numDays; i++) {
                Cell c = header2.createCell(7 + i);
                c.setCellValue(data.getDayColumns().get(i).getDayNumber());
                c.setCellStyle(headerStyle);
            }
            for (int i = 0; i < summaryHeaders.length; i++) {
                Cell c = header2.createCell(7 + numDays + i);
                c.setCellValue("");
                c.setCellStyle(headerStyle);
            }

            int rowNum = 2;
            for (EmployeeAttendanceDTO emp : data.getEmployees()) {
                Row row = sheet.createRow(rowNum++);
                setCell(row, 0, String.valueOf(emp.getSerialNo()), dataStyle);
                setCell(row, 1, emp.getGender(), dataStyle);
                setCell(row, 2, emp.getEmployeeCode(), dataStyle);
                setCell(row, 3, emp.getEmployeeName(), dataStyle);
                setCell(row, 4, emp.getDepartment(), dataStyle);
                setCell(row, 5, emp.getDoj(), dataStyle);
                setCell(row, 6, String.valueOf(emp.getVintage()), dataStyle);
                for (int i = 0; i < numDays; i++) {
                    setCell(row, 7 + i, emp.getDays().get(i), dataStyle);
                }
                setCell(row, 7 + numDays, String.valueOf(emp.getTotalPresent()), dataStyle);
                setCell(row, 8 + numDays, String.valueOf(emp.getTotalLeave()), dataStyle);
                setCell(row, 9 + numDays, String.valueOf(emp.getTotalML()), dataStyle);
                setCell(row, 10 + numDays, String.valueOf(emp.getTotalLeave() + emp.getTotalML()), dataStyle);
            }

            sheet.createFreezePane(7, 2);
            sheet.autoSizeColumn(0);
            sheet.autoSizeColumn(2);
            sheet.autoSizeColumn(3);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to export attendance Excel", e);
        }
    }

    @Transactional
    public Map<String, Object> importExcel(MultipartFile file, LocalDate fromDate, LocalDate toDate) {
        LocalDate monthStart = fromDate;
        LocalDate monthEnd = toDate;
        int numDays = (int) ChronoUnit.DAYS.between(monthStart, monthEnd) + 1;

        List<Map<String, String>> errors = new ArrayList<>();
        int imported = 0;

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Map<String, Employee> employeeMap = employeeRepository.findAll().stream()
                .collect(Collectors.toMap(Employee::getEmployeeCode, e -> e, (a, b) -> a));

            int startRow = 2;
            for (int i = startRow; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String empCode = getCellStringValue(row.getCell(2));
                if (empCode == null || empCode.isBlank()) continue;

                Employee emp = employeeMap.get(empCode.trim());
                if (emp == null) {
                    errors.add(Map.of("row", String.valueOf(i + 1), "message", "Employee not found: " + empCode));
                    continue;
                }

                for (int d = 0; d < numDays; d++) {
                    Cell cell = row.getCell(7 + d);
                    String status = getCellStringValue(cell);
                    if (status == null || status.isBlank()) continue;
                    status = status.toUpperCase().trim();
                    if (!Set.of("P", "A", "L", "ML", "H", "WO", "R", "CO").contains(status)) continue;

                    LocalDate date = monthStart.plusDays(d);
                    AttendanceRecord record = attendanceRepository
                        .findByEmployeeIdAndAttendanceDate(emp.getId(), date)
                        .orElseGet(() -> AttendanceRecord.builder()
                            .employee(emp)
                            .attendanceDate(date)
                            .build());
                    record.setStatus(status);
                    if (record.getEmployee() == null) record.setEmployee(emp);
                    attendanceRepository.save(record);
                    imported++;

                    if ("P".equals(status) && isHolidayOrWeekOff(date)) {
                        if (!compOffRepository.existsByEmployeeIdAndEarnedDateAndStatus(emp.getId(), date, "EARNED")) {
                            CompOff co = CompOff.builder()
                                .employee(emp)
                                .earnedDate(date)
                                .expiryDate(date.plusMonths(3))
                                .status("EARNED")
                                .remarks("Auto-earned: Worked on holiday/week-off")
                                .build();
                            compOffRepository.save(co);
                        }
                    }
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse attendance Excel file", e);
        }

        log.info("Attendance import: {} records imported, {} errors", imported, errors.size());
        return Map.of("imported", imported, "errors", errors);
    }

    @Transactional
    public int deleteFutureAttendance(LocalDate cutOffDate) {
        int count = attendanceRepository.deleteByAttendanceDateAfter(cutOffDate);
        log.info("Deleted {} attendance records after {}", count, cutOffDate);
        return count;
    }

    private void setCell(Row row, int col, String value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value != null ? value : "");
        c.setCellStyle(style);
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case FORMULA -> {
                try { yield String.valueOf((long) cell.getNumericCellValue()); }
                catch (Exception e) { yield ""; }
            }
            default -> null;
        };
    }
}
