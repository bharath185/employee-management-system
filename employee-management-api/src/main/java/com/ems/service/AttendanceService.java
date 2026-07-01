package com.ems.service;

import com.ems.dto.AttendanceDTO;
import com.ems.dto.EmployeeAttendanceDTO;
import com.ems.dto.MonthlyAttendanceDTO;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.AttendanceRecord;
import com.ems.model.Employee;
import com.ems.repository.AttendanceRepository;
import com.ems.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    public MonthlyAttendanceDTO getMonthlyAttendance(int year, int month) {
        List<Employee> employees = employeeRepository.findAll();
        List<AttendanceRecord> records = attendanceRepository.findByYearAndMonth(year, month);

        Map<Long, Map<Integer, String>> recordMap = new HashMap<>();
        for (AttendanceRecord r : records) {
            recordMap.computeIfAbsent(r.getEmployee().getId(), k -> new HashMap<>())
                .put(r.getAttendanceDate().getDayOfMonth(), r.getStatus());
        }

        int daysInMonth = LocalDate.of(year, month, 1).lengthOfMonth();
        List<EmployeeAttendanceDTO> employeeDTOs = new ArrayList<>();

        for (Employee emp : employees) {
            Map<Integer, String> empDays = recordMap.getOrDefault(emp.getId(), new HashMap<>());
            Map<Integer, String> days = new LinkedHashMap<>();
            int p = 0, a = 0, l = 0, h = 0, wo = 0;

            for (int d = 1; d <= daysInMonth; d++) {
                String status = empDays.getOrDefault(d, "");
                days.put(d, status);
                switch (status) {
                    case "P" -> p++;
                    case "A" -> a++;
                    case "L" -> l++;
                    case "H" -> h++;
                    case "WO" -> wo++;
                }
            }

            employeeDTOs.add(EmployeeAttendanceDTO.builder()
                .employeeId(emp.getId())
                .employeeCode(emp.getEmployeeCode())
                .employeeName(emp.getFullName())
                .designation(emp.getDesignation())
                .days(days)
                .totalPresent(p)
                .totalAbsent(a)
                .totalLeave(l)
                .totalHoliday(h)
                .totalWeeklyOff(wo)
                .build());
        }

        return MonthlyAttendanceDTO.builder()
            .year(year)
            .month(month)
            .daysInMonth(daysInMonth)
            .employees(employeeDTOs)
            .build();
    }

    @Transactional
    public void bulkUpsert(List<AttendanceDTO> records) {
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
        }
        log.info("Attendance bulk upsert: {} records", records.size());
    }

    public byte[] exportExcel(int year, int month) {
        MonthlyAttendanceDTO data = getMonthlyAttendance(year, month);
        int daysInMonth = data.getDaysInMonth();

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet(String.format("Attendance_%d_%02d", year, month));

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

            Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("Employee Code");
            headerRow.getCell(0).setCellStyle(headerStyle);
            headerRow.createCell(1).setCellValue("Employee Name");
            headerRow.getCell(1).setCellStyle(headerStyle);

            for (int d = 1; d <= daysInMonth; d++) {
                Cell cell = headerRow.createCell(d + 1);
                cell.setCellValue(d);
                cell.setCellStyle(headerStyle);
            }
            {
                Cell cell = headerRow.createCell(daysInMonth + 2);
                cell.setCellValue("Total P");
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (EmployeeAttendanceDTO emp : data.getEmployees()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(emp.getEmployeeCode());
                row.getCell(0).setCellStyle(dataStyle);
                row.createCell(1).setCellValue(emp.getEmployeeName());
                row.getCell(1).setCellStyle(dataStyle);

                for (int d = 1; d <= daysInMonth; d++) {
                    Cell cell = row.createCell(d + 1);
                    cell.setCellValue(emp.getDays().getOrDefault(d, ""));
                    cell.setCellStyle(dataStyle);
                }
                {
                    Cell cell = row.createCell(daysInMonth + 2);
                    cell.setCellValue(emp.getTotalPresent());
                    cell.setCellStyle(dataStyle);
                }
            }

            sheet.autoSizeColumn(0);
            sheet.autoSizeColumn(1);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to export attendance Excel", e);
        }
    }

    @Transactional
    public Map<String, Object> importExcel(MultipartFile file, int year, int month) {
        List<Map<String, String>> errors = new ArrayList<>();
        int imported = 0;
        int daysInMonth = LocalDate.of(year, month, 1).lengthOfMonth();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Map<String, Employee> employeeMap = employeeRepository.findAll().stream()
                .collect(Collectors.toMap(Employee::getEmployeeCode, e -> e, (a, b) -> a));

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String empCode = getCellStringValue(row.getCell(0));
                if (empCode == null || empCode.isBlank()) continue;

                Employee emp = employeeMap.get(empCode);
                if (emp == null) {
                    errors.add(Map.of("row", String.valueOf(i + 1), "message", "Employee not found: " + empCode));
                    continue;
                }

                for (int d = 1; d <= daysInMonth; d++) {
                    Cell cell = row.getCell(d + 1);
                    String status = getCellStringValue(cell);
                    if (status == null || status.isBlank()) continue;
                    status = status.toUpperCase().trim();
                    if (!Set.of("P", "A", "L", "H", "WO").contains(status)) continue;

                    LocalDate date = LocalDate.of(year, month, d);
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
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse attendance Excel file", e);
        }

        log.info("Attendance import: {} records imported, {} errors", imported, errors.size());
        return Map.of("imported", imported, "errors", errors);
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
            default -> null;
        };
    }
}
