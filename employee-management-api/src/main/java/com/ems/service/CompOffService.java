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
    private final com.ems.repository.LeaveBalanceRepository leaveBalanceRepository;
    private final com.ems.repository.LeaveTypeRepository leaveTypeRepository;

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
    public void recordCompOffEarned(Employee employee, LocalDate earnedDate, String remarks) {
        if (!compOffRepository.existsByEmployeeIdAndEarnedDateAndStatus(employee.getId(), earnedDate, "EARNED")) {
            CompOff compOff = CompOff.builder()
                .employee(employee)
                .earnedDate(earnedDate)
                .status("EARNED")
                .remarks(remarks != null ? remarks : "Comp-off Earned (COG)")
                .build();
            compOffRepository.save(compOff);
        }

        // Sync CO Leave Balance for earned year
        syncLeaveBalanceEarned(employee, earnedDate.getYear(), 1);
    }

    @Transactional
    public void cancelCompOffEarned(Employee employee, LocalDate earnedDate) {
        compOffRepository.findFirstByEmployeeIdAndEarnedDateAndStatus(employee.getId(), earnedDate, "EARNED")
            .ifPresent(co -> {
                compOffRepository.delete(co);
                syncLeaveBalanceEarned(employee, earnedDate.getYear(), -1);
            });
    }

    @Transactional
    public void recordCompOffAvailed(Employee employee, LocalDate availedDate) {
        compOffRepository.findFirstByEmployeeIdAndStatusOrderByEarnedDateAsc(employee.getId(), "EARNED")
            .ifPresentOrElse(co -> {
                co.setStatus("AVAILED");
                co.setAvailedDate(availedDate);
                compOffRepository.save(co);
            }, () -> {
                log.warn("Recording availed comp-off for emp {} but no EARNED comp-off found in DB", employee.getEmployeeCode());
            });

        // Sync CO Leave Balance for availed year
        syncLeaveBalanceTaken(employee, availedDate.getYear(), 1);
    }

    @Transactional
    public void cancelCompOffAvailed(Employee employee, LocalDate availedDate) {
        compOffRepository.findFirstByEmployeeIdAndAvailedDateAndStatus(employee.getId(), availedDate, "AVAILED")
            .or(() -> compOffRepository.findFirstByEmployeeIdAndStatusOrderByAvailedDateDesc(employee.getId(), "AVAILED"))
            .ifPresent(co -> {
                co.setStatus("EARNED");
                co.setAvailedDate(null);
                compOffRepository.save(co);
                syncLeaveBalanceTaken(employee, availedDate.getYear(), -1);
            });
    }

    private com.ems.model.LeaveType getOrCreateCOLeaveType() {
        return leaveTypeRepository.findByName("CO")
            .orElseGet(() -> leaveTypeRepository.save(com.ems.model.LeaveType.builder()
                .name("CO")
                .description("Compensatory Off")
                .annualEntitlement(0)
                .isCarryForward(false)
                .isActive(true)
                .build()));
    }

    private void syncLeaveBalanceEarned(Employee employee, int year, int delta) {
        com.ems.model.LeaveType coType = getOrCreateCOLeaveType();
        com.ems.model.LeaveBalance balance = leaveBalanceRepository
            .findByEmployeeIdAndLeaveTypeIdAndYear(employee.getId(), coType.getId(), year)
            .orElseGet(() -> com.ems.model.LeaveBalance.builder()
                .employee(employee)
                .leaveType(coType)
                .year(year)
                .entitled(0)
                .taken(0)
                .encashed(0)
                .balance(0)
                .build());

        balance.setEntitled(Math.max(0, balance.getEntitled() + delta));
        balance.computeBalance();
        leaveBalanceRepository.save(balance);
    }

    private void syncLeaveBalanceTaken(Employee employee, int year, int delta) {
        com.ems.model.LeaveType coType = getOrCreateCOLeaveType();
        com.ems.model.LeaveBalance balance = leaveBalanceRepository
            .findByEmployeeIdAndLeaveTypeIdAndYear(employee.getId(), coType.getId(), year)
            .orElseGet(() -> com.ems.model.LeaveBalance.builder()
                .employee(employee)
                .leaveType(coType)
                .year(year)
                .entitled(0)
                .taken(0)
                .encashed(0)
                .balance(0)
                .build());

        balance.setTaken(Math.max(0, balance.getTaken() + delta));
        balance.computeBalance();
        leaveBalanceRepository.save(balance);
    }

    @Transactional
    public CompOffDTO earnCompOff(Long employeeId, LocalDate earnedDate) {
        if (compOffRepository.existsByEmployeeIdAndEarnedDateAndStatus(employeeId, earnedDate, "EARNED")) {
            throw new BadRequestException("Comp-Off already earned for this date");
        }
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found"));
        recordCompOffEarned(employee, earnedDate, "Manual Comp-Off Earned");
        return compOffRepository.findFirstByEmployeeIdAndEarnedDateAndStatus(employeeId, earnedDate, "EARNED")
            .map(CompOffDTO::fromEntity)
            .orElseThrow(() -> new RuntimeException("Failed to save Comp-Off"));
    }

    @Transactional
    public CompOffDTO availOneCompOff(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found"));
        CompOff compOff = compOffRepository.findFirstByEmployeeIdAndStatusOrderByEarnedDateAsc(employeeId, "EARNED")
            .orElseThrow(() -> new BadRequestException("No Comp-Off balance available"));
        recordCompOffAvailed(employee, LocalDate.now());
        return CompOffDTO.fromEntity(compOff);
    }

    @Transactional
    public void restoreOneCompOff(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found"));
        cancelCompOffAvailed(employee, LocalDate.now());
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
                    recordCompOffEarned(emp, earnedDate, rem != null ? rem : "Imported Comp-Off");
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
