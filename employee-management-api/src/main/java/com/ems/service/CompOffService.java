package com.ems.service;

import com.ems.dto.CompOffDTO;
import com.ems.exception.BadRequestException;
import com.ems.model.CompOff;
import com.ems.model.Employee;
import com.ems.repository.CompOffRepository;
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
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompOffService {

    private final CompOffRepository compOffRepository;
    private final EmployeeRepository employeeRepository;

    public List<CompOffDTO> getCompOffs(Long employeeId) {
        List<CompOff> list;
        if (employeeId != null) {
            list = compOffRepository.findByEmployeeIdOrderByEarnedDateDesc(employeeId);
        } else {
            list = compOffRepository.findAllByOrderByEarnedDateDesc();
        }
        return list.stream().map(CompOffDTO::fromEntity).toList();
    }

    public long getAvailableCount(Long employeeId) {
        return compOffRepository.countByEmployeeIdAndStatus(employeeId, "EARNED");
    }

    @Transactional
    public CompOffDTO earnCompOff(Long employeeId, LocalDate earnedDate) {
        if (compOffRepository.existsByEmployeeIdAndEarnedDateAndStatus(employeeId, earnedDate, "EARNED")) {
            throw new BadRequestException("Comp-Off already earned for this date");
        }
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found"));
        CompOff compOff = CompOff.builder()
            .employee(employee)
            .earnedDate(earnedDate)
            .status("EARNED")
            .build();
        return CompOffDTO.fromEntity(compOffRepository.save(compOff));
    }

    @Transactional
    public CompOffDTO availOneCompOff(Long employeeId) {
        CompOff compOff = compOffRepository.findFirstByEmployeeIdAndStatusOrderByEarnedDateAsc(employeeId, "EARNED")
            .orElseThrow(() -> new BadRequestException("No Comp-Off balance available"));
        compOff.setStatus("AVAILED");
        compOff.setAvailedDate(LocalDate.now());
        return CompOffDTO.fromEntity(compOffRepository.save(compOff));
    }

    @Transactional
    public void restoreOneCompOff(Long employeeId) {
        compOffRepository.findFirstByEmployeeIdAndStatusOrderByAvailedDateDesc(employeeId, "AVAILED")
            .ifPresent(co -> {
                co.setStatus("EARNED");
                co.setAvailedDate(null);
                compOffRepository.save(co);
            });
    }

    public byte[] exportExcel() {
        List<CompOff> list = compOffRepository.findAllByOrderByEarnedDateDesc();
        DateTimeFormatter df = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Comp-Offs");
            CellStyle headerStyle = wb.createCellStyle();
            Font hf = wb.createFont(); hf.setBold(true); hf.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(hf);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            addBorder(headerStyle);

            CellStyle dataStyle = wb.createCellStyle();
            dataStyle.setAlignment(HorizontalAlignment.CENTER);
            addBorder(dataStyle);

            String[] headers = {"Emp Code", "Earned Date", "Status", "Availed Date", "Remarks"};
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) { Cell c = hRow.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(headerStyle); }

            int r = 1;
            for (CompOff co : list) {
                Row row = sheet.createRow(r++);
                String empCode = co.getEmployee() != null ? co.getEmployee().getEmployeeCode() : "";
                setCell(row, 0, empCode, dataStyle);
                setCell(row, 1, co.getEarnedDate() != null ? co.getEarnedDate().format(df) : "", dataStyle);
                setCell(row, 2, co.getStatus() != null ? co.getStatus() : "", dataStyle);
                setCell(row, 3, co.getAvailedDate() != null ? co.getAvailedDate().format(df) : "", dataStyle);
                setCell(row, 4, co.getRemarks() != null ? co.getRemarks() : "", dataStyle);
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to export comp-off Excel", e);
        }
    }

    @Transactional
    public Map<String, Object> importExcel(MultipartFile file) {
        List<Map<String, String>> errors = new ArrayList<>();
        int imported = 0;
        DateTimeFormatter df = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            Map<String, Employee> empMap = employeeRepository.findAll().stream()
                .collect(Collectors.toMap(Employee::getEmployeeCode, e -> e, (a, b) -> a));
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String empCode = getCellString(row.getCell(0));
                if (empCode == null || empCode.isBlank()) continue;
                Employee emp = empMap.get(empCode.trim());
                if (emp == null) {
                    errors.add(Map.of("row", String.valueOf(i + 1), "message", "Employee not found: " + empCode));
                    continue;
                }
                String earnedStr = getCellString(row.getCell(1));
                if (earnedStr == null || earnedStr.isBlank()) continue;
                LocalDate earnedDate = LocalDate.parse(earnedStr, df);
                if (!compOffRepository.existsByEmployeeIdAndEarnedDateAndStatus(emp.getId(), earnedDate, "EARNED")) {
                    String rem = getCellString(row.getCell(2));
                    CompOff co = CompOff.builder()
                        .employee(emp).earnedDate(earnedDate).status("EARNED")
                        .remarks(rem != null ? rem : "").build();
                    compOffRepository.save(co);
                    imported++;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to import comp-off Excel: " + e.getMessage());
        }
        log.info("Comp-off import: {} records, {} errors", imported, errors.size());
        return Map.of("imported", imported, "errors", errors);
    }

    private void addBorder(CellStyle style) {
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }

    private void setCell(Row row, int col, String value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value != null ? value : "");
        c.setCellStyle(style);
    }

    private String getCellString(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double v = cell.getNumericCellValue();
                if (v == Math.floor(v) && !Double.isInfinite(v)) yield String.valueOf((long) v);
                yield String.valueOf(v);
            }
            default -> null;
        };
    }

    public byte[] generateSampleExcel() {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Comp-Off Import");
            CellStyle headerStyle = wb.createCellStyle();
            Font hf = wb.createFont(); hf.setBold(true);
            headerStyle.setFont(hf);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            addBorder(headerStyle);

            Row hRow = sheet.createRow(0);
            String[] headers = {"Emp Code", "Earned Date (yyyy-MM-dd)", "Remarks (optional)"};
            for (int i = 0; i < headers.length; i++) {
                Cell c = hRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }
            Row sRow = sheet.createRow(1);
            String[] sample = {"PARI001", LocalDate.now().minusDays(7).toString(), "Worked on Sunday"};
            for (int i = 0; i < sample.length; i++) {
                Cell c = sRow.createCell(i);
                c.setCellValue(sample[i]);
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            sheet.autoSizeColumn(1);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate sample", e);
        }
    }
}
