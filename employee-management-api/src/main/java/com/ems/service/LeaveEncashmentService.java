package com.ems.service;

import com.ems.dto.LeaveEncashmentDTO;
import com.ems.exception.BadRequestException;
import com.ems.model.Employee;
import com.ems.model.LeaveBalance;
import com.ems.model.LeaveEncashment;
import com.ems.model.LeaveType;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.LeaveBalanceRepository;
import com.ems.repository.LeaveEncashmentRepository;
import com.ems.repository.LeaveTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeaveEncashmentService {

    private final LeaveEncashmentRepository encashmentRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveExcelService leaveExcelService;

    public List<LeaveEncashmentDTO> getEncashments(Long employeeId) {
        List<LeaveEncashment> encashments;
        if (employeeId != null) {
            encashments = encashmentRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
        } else {
            encashments = encashmentRepository.findAllByOrderByCreatedAtDesc();
        }
        return encashments.stream()
            .map(LeaveEncashmentDTO::fromEntity)
            .toList();
    }

    @Transactional
    public LeaveEncashmentDTO createEncashment(LeaveEncashmentDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
            .orElseThrow(() -> new RuntimeException("Employee not found"));
        LeaveType leaveType = leaveTypeRepository.findById(dto.getLeaveTypeId())
            .orElseThrow(() -> new RuntimeException("Leave type not found"));

        int year = dto.getYear() != null ? dto.getYear() : java.time.Year.now().getValue();
        int month = dto.getMonth() != null ? dto.getMonth() : java.time.LocalDate.now().getMonthValue();
        Optional<LeaveBalance> balanceOpt = leaveBalanceRepository
            .findByEmployeeIdAndLeaveTypeIdAndYear(employee.getId(), leaveType.getId(), year);
        if (balanceOpt.isEmpty() || balanceOpt.get().getBalance() <= 0) {
            throw new BadRequestException("No available balance to encash for " + leaveType.getName());
        }
        if (balanceOpt.get().getBalance() < dto.getEncashedDays()) {
            throw new BadRequestException("Insufficient balance: " + balanceOpt.get().getBalance()
                + " available, " + dto.getEncashedDays() + " requested");
        }

        LeaveEncashment encashment = LeaveEncashment.builder()
            .employee(employee)
            .leaveType(leaveType)
            .encashedDays(dto.getEncashedDays())
            .encashmentAmount(dto.getEncashmentAmount())
            .month(month)
            .year(year)
            .remarks(dto.getRemarks())
            .status("PENDING")
            .build();
        LeaveEncashment saved = encashmentRepository.save(encashment);
        return LeaveEncashmentDTO.fromEntity(saved);
    }

    @Transactional
    public LeaveEncashmentDTO approveEncashment(Long id, String approvedBy) {
        LeaveEncashment enc = encashmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Encashment not found"));
        if (!"PENDING".equals(enc.getStatus())) {
            throw new BadRequestException("Only pending encashments can be approved");
        }

        LeaveBalance balance = leaveBalanceRepository
            .findByEmployeeIdAndLeaveTypeIdAndYear(
                enc.getEmployee().getId(), enc.getLeaveType().getId(), enc.getYear())
            .orElseThrow(() -> new BadRequestException("Leave balance not found"));

        if (balance.getBalance() < enc.getEncashedDays()) {
            throw new BadRequestException("Insufficient balance: " + balance.getBalance()
                + " available, " + enc.getEncashedDays() + " requested");
        }

        balance.setEncashed(balance.getEncashed() + enc.getEncashedDays());
        balance.computeBalance();
        leaveBalanceRepository.save(balance);

        leaveExcelService.updateAvailed(
            enc.getEmployee().getEmployeeCode(),
            enc.getLeaveType().getName(),
            enc.getEncashedDays(),
            enc.getMonth(),
            enc.getYear()
        );

        enc.setStatus("APPROVED");
        enc.setApprovedBy(approvedBy);
        enc.setApprovedDate(java.time.LocalDateTime.now());
        log.info("Encashment {} approved by {}, {} days deducted from {}",
            id, approvedBy, enc.getEncashedDays(), enc.getLeaveType().getName());
        return LeaveEncashmentDTO.fromEntity(encashmentRepository.save(enc));
    }

    @Transactional
    public LeaveEncashmentDTO rejectEncashment(Long id, String rejectedBy) {
        LeaveEncashment enc = encashmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Encashment not found"));
        if (!"PENDING".equals(enc.getStatus())) {
            throw new BadRequestException("Only pending encashments can be rejected");
        }
        enc.setStatus("REJECTED");
        enc.setApprovedBy(null);
        enc.setApprovedDate(null);
        return LeaveEncashmentDTO.fromEntity(encashmentRepository.save(enc));
    }

    public byte[] exportExcel() {
        List<LeaveEncashment> list = encashmentRepository.findAllByOrderByCreatedAtDesc();
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Encashments");
            CellStyle headerStyle = headerStyle(wb);

            String[] headers = {"Emp Code", "Emp Name", "Leave Type", "Days", "Amount", "Month", "Year", "Status", "Remarks"};
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) { Cell c = hRow.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(headerStyle); }

            int r = 1;
            CellStyle dataStyle = dataStyle(wb);
            for (LeaveEncashment e : list) {
                Row row = sheet.createRow(r++);
                setCell(row, 0, e.getEmployee() != null ? e.getEmployee().getEmployeeCode() : "", dataStyle);
                setCell(row, 1, e.getEmployee() != null ? e.getEmployee().getFullName() : "", dataStyle);
                setCell(row, 2, e.getLeaveType() != null ? e.getLeaveType().getName() : "", dataStyle);
                setCell(row, 3, e.getEncashedDays() != null ? String.valueOf(e.getEncashedDays()) : "", dataStyle);
                setCell(row, 4, e.getEncashmentAmount() != null ? e.getEncashmentAmount().toString() : "", dataStyle);
                setCell(row, 5, e.getMonth() != null ? String.valueOf(e.getMonth()) : "", dataStyle);
                setCell(row, 6, e.getYear() != null ? String.valueOf(e.getYear()) : "", dataStyle);
                setCell(row, 7, e.getStatus() != null ? e.getStatus() : "", dataStyle);
                setCell(row, 8, e.getRemarks() != null ? e.getRemarks() : "", dataStyle);
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to export encashment Excel", ex);
        }
    }

    @Transactional
    public Map<String, Object> importExcel(MultipartFile file) {
        List<Map<String, String>> errors = new ArrayList<>();
        int imported = 0;
        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            Map<String, Employee> empMap = employeeRepository.findAll().stream()
                .collect(Collectors.toMap(e -> e.getEmployeeCode().trim(), e -> e, (a, b) -> a));
            List<LeaveType> leaveTypes = leaveTypeRepository.findByIsActiveTrue();
            Map<String, LeaveType> ltMap = leaveTypes.stream()
                .collect(Collectors.toMap(lt -> lt.getName().toUpperCase(), lt -> lt, (a, b) -> a));

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String empCode = getCellStr(row.getCell(0));
                if (empCode == null || empCode.isBlank()) continue;
                Employee emp = empMap.get(empCode.trim());
                if (emp == null) { errors.add(Map.of("row", String.valueOf(i + 1), "message", "Employee not found: " + empCode)); continue; }

                String ltName = getCellStr(row.getCell(2));
                LeaveType lt = ltName != null ? ltMap.get(ltName.trim().toUpperCase()) : null;
                if (lt == null) { errors.add(Map.of("row", String.valueOf(i + 1), "message", "Invalid leave type: " + ltName)); continue; }

                try {
                    int days = Integer.parseInt(getCellStr(row.getCell(3)).trim());
                    BigDecimal amount = new BigDecimal(getCellStr(row.getCell(4)).trim());
                    int month = Integer.parseInt(getCellStr(row.getCell(5)).trim());
                    int year = Integer.parseInt(getCellStr(row.getCell(6)).trim());
                    String remarks = getCellStr(row.getCell(8));

                    LeaveEncashment e = LeaveEncashment.builder()
                        .employee(emp).leaveType(lt).encashedDays(days)
                        .encashmentAmount(amount).month(month).year(year)
                        .remarks(remarks != null ? remarks : "").status("PENDING").build();
                    encashmentRepository.save(e);
                    imported++;
                } catch (Exception ex) {
                    errors.add(Map.of("row", String.valueOf(i + 1), "message", "Parse error: " + ex.getMessage()));
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to import encashment Excel: " + e.getMessage());
        }
        log.info("Encashment import: {} records, {} errors", imported, errors.size());
        return Map.of("imported", imported, "errors", errors);
    }

    public byte[] generateSampleExcel() {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Encashment Import");
            CellStyle headerStyle = headerStyle(wb);
            String[] headers = {"Emp Code", "Emp Name (ignored)", "Leave Type", "Days", "Amount", "Month", "Year", "Status (ignored)", "Remarks"};
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) { Cell c = hRow.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(headerStyle); }
            Row sRow = sheet.createRow(1);
            String[] sample = {"PARI001", "Ravi Kumar", "PL", "2", "500.00", String.valueOf(LocalDate.now().getMonthValue()), String.valueOf(LocalDate.now().getYear()), "PENDING", "Bulk import"};
            CellStyle dataStyle = dataStyle(wb);
            for (int i = 0; i < sample.length; i++) setCell(sRow, i, sample[i], dataStyle);
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to generate sample", ex);
        }
    }

    private CellStyle headerStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font f = wb.createFont(); f.setBold(true); f.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(f);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        addBorder(style);
        return style;
    }

    private CellStyle dataStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        addBorder(style);
        return style;
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

    private String getCellStr(Cell cell) {
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
}
