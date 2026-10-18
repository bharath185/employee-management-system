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
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
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

import com.ems.model.LeaveApplication;
import com.ems.repository.LeaveApplicationRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class MonthlyLeaveService {

    private final MonthlyLeaveBalanceRepository monthlyLeaveBalanceRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveApplicationRepository leaveApplicationRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public List<MonthlyLeaveBalanceDTO> getMonthlyBalances(int year, int month) {
        List<MonthlyLeaveBalance> existing = monthlyLeaveBalanceRepository.findByYearAndMonthWithEmployee(year, month);
        if (existing.isEmpty()) {
            return Collections.emptyList();
        }

        // Fetch all leave applications overlapping this month
        List<LeaveApplication> monthApps = leaveApplicationRepository.findByMonth(year, month);
        Map<Long, List<LeaveApplication>> appsByEmp = monthApps.stream()
                .filter(a -> a.getEmployee() != null && a.getEmployee().getId() != null)
                .collect(Collectors.groupingBy(a -> a.getEmployee().getId()));

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd-MM-yyyy");
        DateTimeFormatter dtfTime = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

        List<MonthlyLeaveBalanceDTO> dtoList = new ArrayList<>();
        List<MonthlyLeaveBalance> toUpdate = new ArrayList<>();

        for (MonthlyLeaveBalance b : existing) {
            Long empId = b.getEmployee() != null ? b.getEmployee().getId() : null;
            List<LeaveApplication> empApps = empId != null ? appsByEmp.getOrDefault(empId, Collections.emptyList()) : Collections.emptyList();

            List<MonthlyLeaveBalanceDTO.LeaveDetailDTO> clDetails = new ArrayList<>();
            List<MonthlyLeaveBalanceDTO.LeaveDetailDTO> plDetails = new ArrayList<>();
            List<MonthlyLeaveBalanceDTO.LeaveDetailDTO> lopDetails = new ArrayList<>();

            double clAvailable = b.getClAfterAdd() != null ? b.getClAfterAdd() : 0.0;
            double plAvailable = b.getPlAfterAdd() != null ? b.getPlAfterAdd() : 0.0;

            double remCl = clAvailable;
            double remPl = plAvailable;
            double calculatedClAvailed = 0.0;
            double calculatedPlAvailed = 0.0;
            double calculatedLop = 0.0;

            // Sort applications by date ascending so earliest leaves deduct first
            List<LeaveApplication> sortedApps = new ArrayList<>(empApps);
            sortedApps.sort(Comparator.comparing(LeaveApplication::getFromDate, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(LeaveApplication::getId, Comparator.nullsLast(Comparator.naturalOrder())));

            for (LeaveApplication app : sortedApps) {
                String typeName = app.getLeaveType() != null && app.getLeaveType().getName() != null 
                        ? app.getLeaveType().getName().trim().toUpperCase() : "";
                double days = app.getDays() != null ? app.getDays() : 1.0;
                boolean isApproved = "APPROVED".equalsIgnoreCase(app.getStatus());

                if (isApproved) {
                    if ("PL".equals(typeName) || typeName.contains("PRIVILEGE")) {
                        // Priority to PL
                        double fromPl = Math.min(remPl, days);
                        remPl -= fromPl;
                        calculatedPlAvailed += fromPl;
                        if (fromPl > 0) {
                            plDetails.add(MonthlyLeaveBalanceDTO.LeaveDetailDTO.builder()
                                    .id(app.getId()).leaveType("PL").fromDate(app.getFromDate() != null ? app.getFromDate().format(dtf) : "")
                                    .toDate(app.getToDate() != null ? app.getToDate().format(dtf) : "").days(fromPl)
                                    .reason(app.getReason() != null ? app.getReason() : "").status("APPROVED")
                                    .appliedDate(app.getAppliedDate() != null ? app.getAppliedDate().format(dtfTime) : "")
                                    .approvedBy(app.getApprovedBy() != null ? app.getApprovedBy() : "").build());
                        }

                        double rem = days - fromPl;
                        if (rem > 0) {
                            double fromCl = Math.min(remCl, rem);
                            remCl -= fromCl;
                            calculatedClAvailed += fromCl;
                            if (fromCl > 0) {
                                clDetails.add(MonthlyLeaveBalanceDTO.LeaveDetailDTO.builder()
                                        .id(app.getId()).leaveType("CL").fromDate(app.getFromDate() != null ? app.getFromDate().format(dtf) : "")
                                        .toDate(app.getToDate() != null ? app.getToDate().format(dtf) : "").days(fromCl)
                                        .reason((app.getReason() != null ? app.getReason() : "") + " (Overflow to CL)")
                                        .status("APPROVED")
                                        .appliedDate(app.getAppliedDate() != null ? app.getAppliedDate().format(dtfTime) : "")
                                        .approvedBy(app.getApprovedBy() != null ? app.getApprovedBy() : "").build());
                            }
                            rem -= fromCl;
                        }

                        if (rem > 0) {
                            calculatedLop += rem;
                            lopDetails.add(MonthlyLeaveBalanceDTO.LeaveDetailDTO.builder()
                                    .id(app.getId()).leaveType("LOP").fromDate(app.getFromDate() != null ? app.getFromDate().format(dtf) : "")
                                    .toDate(app.getToDate() != null ? app.getToDate().format(dtf) : "").days(rem)
                                    .reason((app.getReason() != null ? app.getReason() : "") + " (Loss of Pay / LOP)")
                                    .status("APPROVED")
                                    .appliedDate(app.getAppliedDate() != null ? app.getAppliedDate().format(dtfTime) : "")
                                    .approvedBy(app.getApprovedBy() != null ? app.getApprovedBy() : "").build());
                        }
                    } else {
                        // Priority to CL (for CL, attendance auto-applied, or general leaves)
                        double fromCl = Math.min(remCl, days);
                        remCl -= fromCl;
                        calculatedClAvailed += fromCl;
                        if (fromCl > 0) {
                            clDetails.add(MonthlyLeaveBalanceDTO.LeaveDetailDTO.builder()
                                    .id(app.getId()).leaveType("CL").fromDate(app.getFromDate() != null ? app.getFromDate().format(dtf) : "")
                                    .toDate(app.getToDate() != null ? app.getToDate().format(dtf) : "").days(fromCl)
                                    .reason(app.getReason() != null ? app.getReason() : "").status("APPROVED")
                                    .appliedDate(app.getAppliedDate() != null ? app.getAppliedDate().format(dtfTime) : "")
                                    .approvedBy(app.getApprovedBy() != null ? app.getApprovedBy() : "").build());
                        }

                        double rem = days - fromCl;
                        if (rem > 0) {
                            double fromPl = Math.min(remPl, rem);
                            remPl -= fromPl;
                            calculatedPlAvailed += fromPl;
                            if (fromPl > 0) {
                                plDetails.add(MonthlyLeaveBalanceDTO.LeaveDetailDTO.builder()
                                        .id(app.getId()).leaveType("PL").fromDate(app.getFromDate() != null ? app.getFromDate().format(dtf) : "")
                                        .toDate(app.getToDate() != null ? app.getToDate().format(dtf) : "").days(fromPl)
                                        .reason((app.getReason() != null ? app.getReason() : "") + " (Overflow to PL)")
                                        .status("APPROVED")
                                        .appliedDate(app.getAppliedDate() != null ? app.getAppliedDate().format(dtfTime) : "")
                                        .approvedBy(app.getApprovedBy() != null ? app.getApprovedBy() : "").build());
                            }
                            rem -= fromPl;
                        }

                        if (rem > 0) {
                            calculatedLop += rem;
                            lopDetails.add(MonthlyLeaveBalanceDTO.LeaveDetailDTO.builder()
                                    .id(app.getId()).leaveType("LOP").fromDate(app.getFromDate() != null ? app.getFromDate().format(dtf) : "")
                                    .toDate(app.getToDate() != null ? app.getToDate().format(dtf) : "").days(rem)
                                    .reason((app.getReason() != null ? app.getReason() : "") + " (Loss of Pay / LOP)")
                                    .status("APPROVED")
                                    .appliedDate(app.getAppliedDate() != null ? app.getAppliedDate().format(dtfTime) : "")
                                    .approvedBy(app.getApprovedBy() != null ? app.getApprovedBy() : "").build());
                        }
                    }
                } else if ("PENDING".equalsIgnoreCase(app.getStatus())) {
                    // Pending applications
                    MonthlyLeaveBalanceDTO.LeaveDetailDTO detail = MonthlyLeaveBalanceDTO.LeaveDetailDTO.builder()
                            .id(app.getId())
                            .leaveType(typeName)
                            .fromDate(app.getFromDate() != null ? app.getFromDate().format(dtf) : "")
                            .toDate(app.getToDate() != null ? app.getToDate().format(dtf) : "")
                            .days(days)
                            .reason(app.getReason() != null ? app.getReason() : "")
                            .status(app.getStatus() != null ? app.getStatus() : "PENDING")
                            .appliedDate(app.getAppliedDate() != null ? app.getAppliedDate().format(dtfTime) : "")
                            .approvedBy(app.getApprovedBy() != null ? app.getApprovedBy() : "")
                            .build();

                    if ("PL".equals(typeName) || typeName.contains("PRIVILEGE")) {
                        plDetails.add(detail);
                    } else {
                        clDetails.add(detail);
                    }
                }
            }

            boolean changed = false;
            if (!empApps.isEmpty()) {
                double roundedCl = Math.round(calculatedClAvailed * 100.0) / 100.0;
                double roundedPl = Math.round(calculatedPlAvailed * 100.0) / 100.0;
                double roundedLop = Math.round(calculatedLop * 100.0) / 100.0;

                if (!Objects.equals(b.getClAvailed(), roundedCl)) {
                    b.setClAvailed(roundedCl);
                    changed = true;
                }
                if (!Objects.equals(b.getPlAvailed(), roundedPl)) {
                    b.setPlAvailed(roundedPl);
                    changed = true;
                }
                if (!Objects.equals(b.getLop(), roundedLop)) {
                    b.setLop(roundedLop);
                    changed = true;
                }
            }

            if (changed) {
                b.calculateValues();
                toUpdate.add(b);
            }

            MonthlyLeaveBalanceDTO dto = MonthlyLeaveBalanceDTO.fromEntity(b);
            dto.setClLeaveDetails(clDetails);
            dto.setPlLeaveDetails(plDetails);
            dto.setLopLeaveDetails(lopDetails);
            dtoList.add(dto);
        }

        if (!toUpdate.isEmpty()) {
            monthlyLeaveBalanceRepository.saveAll(toUpdate);
            monthlyLeaveBalanceRepository.flush();
        }

        dtoList.sort(Comparator.comparing(m -> m.getEmployeeCode() != null ? m.getEmployeeCode() : ""));
        return dtoList;
    }

    public static double[] calculateMonthlyAccrual(Employee emp, int year, int month) {
        if (emp == null || emp.getDoj() == null) {
            return new double[]{1.0, 1.5}; // Default 1 CL, 1.5 PL
        }

        LocalDate currentMonth = LocalDate.of(year, month, 1);
        LocalDate dojMonth = emp.getDoj().withDayOfMonth(1);

        // Not joined yet in this month
        if (currentMonth.isBefore(dojMonth)) {
            return new double[]{0.0, 0.0};
        }

        // Calculate vintage in months as of this month
        long vintageMonths = ChronoUnit.MONTHS.between(dojMonth, currentMonth);

        // If joining date below 6 months: ONLY 1 CL (0 PL)
        if (vintageMonths < 6) {
            return new double[]{1.0, 0.0};
        }

        // Rest all (6 months and above) will get 1 CL and 1.5 PL
        return new double[]{1.0, 1.5};
    }

    public void cascadeCarryForward(Collection<Long> employeeIds, int fromYear, int fromMonth) {
        if (employeeIds == null || employeeIds.isEmpty()) return;

        List<MonthlyLeaveBalance> futureRecords = monthlyLeaveBalanceRepository.findFutureMonthsForEmployees(employeeIds, fromYear, fromMonth);
        if (futureRecords.isEmpty()) return;

        Map<Long, List<MonthlyLeaveBalance>> byEmployee = futureRecords.stream()
                .filter(r -> r.getEmployee() != null && r.getEmployee().getId() != null)
                .collect(Collectors.groupingBy(r -> r.getEmployee().getId()));

        List<MonthlyLeaveBalance> toUpdate = new ArrayList<>();

        for (Long empId : employeeIds) {
            List<MonthlyLeaveBalance> empFuture = byEmployee.get(empId);
            if (empFuture == null || empFuture.isEmpty()) continue;

            empFuture.sort(Comparator.comparing(MonthlyLeaveBalance::getYear).thenComparing(MonthlyLeaveBalance::getMonth));

            Optional<MonthlyLeaveBalance> currentOpt = monthlyLeaveBalanceRepository.findByEmployeeIdAndYearAndMonth(empId, fromYear, fromMonth);
            if (currentOpt.isEmpty()) continue;

            double carryCl = currentOpt.get().getClClosing() != null ? currentOpt.get().getClClosing() : 0.0;
            double carryPl = currentOpt.get().getPlClosing() != null ? currentOpt.get().getPlClosing() : 0.0;

            for (MonthlyLeaveBalance future : empFuture) {
                boolean changed = false;
                if (!Objects.equals(future.getClOpening(), carryCl)) {
                    future.setClOpening(carryCl);
                    changed = true;
                }
                if (!Objects.equals(future.getPlOpening(), carryPl)) {
                    future.setPlOpening(carryPl);
                    changed = true;
                }

                if (changed) {
                    future.calculateValues();
                    toUpdate.add(future);
                }

                carryCl = future.getClClosing() != null ? future.getClClosing() : 0.0;
                carryPl = future.getPlClosing() != null ? future.getPlClosing() : 0.0;
            }
        }

        if (!toUpdate.isEmpty()) {
            monthlyLeaveBalanceRepository.saveAll(toUpdate);
            monthlyLeaveBalanceRepository.flush();
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    public int cleanupTestRecords() {
        try {
            int deleted = jdbcTemplate.update("DELETE FROM monthly_leave_balances WHERE NOT (year = 2026 AND month = 10)");
            if (deleted > 0) {
                log.info("Cleaned up {} test monthly leave balance records, keeping only October 2026", deleted);
            }
            jdbcTemplate.update("UPDATE monthly_leave_balances SET pl_opening = 0.0, pl_after_add = pl_added, pl_closing = pl_added - pl_availed WHERE year = 2026 AND month = 10 AND pl_opening = 1.5 AND cl_opening = 0.0");
            return deleted;
        } catch (Exception e) {
            log.warn("Cleanup test months error: {}", e.getMessage());
            return 0;
        }
    }

    @Transactional
    public List<MonthlyLeaveBalanceDTO> batchUpdate(List<MonthlyLeaveBalanceDTO> dtoList) {
        if (dtoList == null || dtoList.isEmpty()) return Collections.emptyList();

        List<Long> ids = dtoList.stream()
                .map(MonthlyLeaveBalanceDTO::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        Map<Long, MonthlyLeaveBalance> entityMap = new HashMap<>();
        if (!ids.isEmpty()) {
            monthlyLeaveBalanceRepository.findAllById(ids).forEach(e -> entityMap.put(e.getId(), e));
        }

        List<MonthlyLeaveBalance> toSave = new ArrayList<>();

        for (MonthlyLeaveBalanceDTO dto : dtoList) {
            MonthlyLeaveBalance entity = null;
            if (dto.getId() != null) {
                entity = entityMap.get(dto.getId());
            } else if (dto.getEmployeeId() != null && dto.getYear() != null && dto.getMonth() != null) {
                entity = monthlyLeaveBalanceRepository.findByEmployeeIdAndYearAndMonth(dto.getEmployeeId(), dto.getYear(), dto.getMonth()).orElse(null);
            }

            if (entity != null) {
                boolean changed = false;

                if (dto.getClOpening() != null && !Objects.equals(entity.getClOpening(), dto.getClOpening())) { entity.setClOpening(dto.getClOpening()); changed = true; }
                if (dto.getPlOpening() != null && !Objects.equals(entity.getPlOpening(), dto.getPlOpening())) { entity.setPlOpening(dto.getPlOpening()); changed = true; }
                if (dto.getClAdded() != null && !Objects.equals(entity.getClAdded(), dto.getClAdded())) { entity.setClAdded(dto.getClAdded()); changed = true; }
                if (dto.getPlAdded() != null && !Objects.equals(entity.getPlAdded(), dto.getPlAdded())) { entity.setPlAdded(dto.getPlAdded()); changed = true; }
                if (dto.getClAvailed() != null && !Objects.equals(entity.getClAvailed(), dto.getClAvailed())) { entity.setClAvailed(dto.getClAvailed()); changed = true; }
                if (dto.getPlAvailed() != null && !Objects.equals(entity.getPlAvailed(), dto.getPlAvailed())) { entity.setPlAvailed(dto.getPlAvailed()); changed = true; }
                if (dto.getLop() != null && !Objects.equals(entity.getLop(), dto.getLop())) { entity.setLop(dto.getLop()); changed = true; }
                if (dto.getLastWorkingDay() != null && !Objects.equals(entity.getLastWorkingDay(), dto.getLastWorkingDay())) { entity.setLastWorkingDay(dto.getLastWorkingDay()); changed = true; }
                if (dto.getRemarks() != null && !Objects.equals(entity.getRemarks(), dto.getRemarks())) { entity.setRemarks(dto.getRemarks()); changed = true; }

                if (changed) {
                    entity.calculateValues();
                    toSave.add(entity);
                }
            }
        }

        if (!toSave.isEmpty()) {
            monthlyLeaveBalanceRepository.saveAll(toSave);
            monthlyLeaveBalanceRepository.flush();

            Set<Long> affectedEmpIds = toSave.stream()
                    .filter(m -> m.getEmployee() != null && m.getEmployee().getId() != null)
                    .map(m -> m.getEmployee().getId())
                    .collect(Collectors.toSet());

            Integer year = dtoList.get(0).getYear();
            Integer month = dtoList.get(0).getMonth();
            if (year != null && month != null) {
                cascadeCarryForward(affectedEmpIds, year, month);
            }
        }

        Integer year = dtoList.get(0).getYear();
        Integer month = dtoList.get(0).getMonth();
        if (year != null && month != null) {
            return monthlyLeaveBalanceRepository.findByYearAndMonthWithEmployee(year, month).stream()
                    .map(MonthlyLeaveBalanceDTO::fromEntity)
                    .collect(Collectors.toList());
        }

        return dtoList;
    }

    @Transactional(readOnly = true)
    public byte[] exportToExcel(int year, int month) throws IOException {
        List<MonthlyLeaveBalance> records = monthlyLeaveBalanceRepository.findByYearAndMonthWithEmployee(year, month);
        return generateExcelFromRecords(year, month, records);
    }

    private byte[] generateExcelFromRecords(int year, int month, List<MonthlyLeaveBalance> records) throws IOException {
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

    @Transactional(readOnly = true)
    public byte[] generateSampleExcel(int year, int month) throws IOException {
        List<MonthlyLeaveBalance> records = monthlyLeaveBalanceRepository.findByYearAndMonthWithEmployee(year, month);
        if (!records.isEmpty()) {
            return generateExcelFromRecords(year, month, records.subList(0, 1));
        }

        List<Employee> activeEmps = employeeRepository.findAll().stream()
                .filter(e -> "LIVE".equalsIgnoreCase(e.getEmployeeStatus()) || "ACTIVE".equalsIgnoreCase(e.getEmployeeStatus()) || e.getEmployeeStatus() == null)
                .sorted(Comparator.comparing(e -> e.getEmployeeCode() != null ? e.getEmployeeCode() : ""))
                .limit(1)
                .collect(Collectors.toList());

        if (!activeEmps.isEmpty()) {
            Employee sampleEmp = activeEmps.get(0);
            MonthlyLeaveBalance sample = new MonthlyLeaveBalance();
            sample.setEmployee(sampleEmp);
            sample.setYear(year);
            sample.setMonth(month);
            sample.setClOpening(1.0);
            sample.setPlOpening(1.5);
            double[] accrual = calculateMonthlyAccrual(sampleEmp, year, month);
            sample.setClAdded(accrual[0]);
            sample.setPlAdded(accrual[1]);
            sample.setClAvailed(0.0);
            sample.setPlAvailed(0.0);
            sample.setLop(0.0);
            sample.calculateValues();
            return generateExcelFromRecords(year, month, Collections.singletonList(sample));
        }

        return generateExcelFromRecords(year, month, Collections.emptyList());
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
            Map<String, Integer> colMap = new LinkedHashMap<>();
            for (int c = 0; c < headerRow.getLastCellNum(); c++) {
                Cell cell = headerRow.getCell(c);
                if (cell != null) {
                    String val = getCellString(cell);
                    if (val != null && !val.isBlank()) {
                        colMap.put(val.replaceAll("\\s+", " ").trim().toLowerCase(), c);
                    }
                }
            }

            int colEmpCode = -1;
            int colClOpen = -1;
            int colPlOpen = -1;
            int colClAdd = -1;
            int colPlAdd = -1;
            int colClAfterAdd = -1;
            int colPlAfterAdd = -1;
            int colClAvail = -1;
            int colPlAvail = -1;
            int colLop = -1;
            int colClClose = -1;
            int colPlClose = -1;
            int colLwd = -1;
            int colRemarks = -1;

            for (Map.Entry<String, Integer> entry : colMap.entrySet()) {
                String h = entry.getKey();
                int idx = entry.getValue();

                if (colEmpCode == -1 && (h.contains("emp.code") || h.contains("emp code") || h.contains("empcode") || h.equals("code") || h.contains("employee code"))) {
                    colEmpCode = idx;
                }
                if (colClAdd == -1 && (h.contains("cl added") || h.contains("cl add") || h.contains("cl credit")) && !h.contains("after")) {
                    colClAdd = idx;
                }
                if (colPlAdd == -1 && (h.contains("pl added") || h.contains("pl add") || h.contains("pl credit")) && !h.contains("after")) {
                    colPlAdd = idx;
                }
                if (colClAfterAdd == -1 && h.contains("after") && h.contains("cl")) {
                    colClAfterAdd = idx;
                }
                if (colPlAfterAdd == -1 && h.contains("after") && h.contains("pl")) {
                    colPlAfterAdd = idx;
                }
                if (colClAvail == -1 && (h.contains("cl availed") || h.contains("cl avail") || h.contains("cl taken") || h.contains("cl used"))) {
                    colClAvail = idx;
                }
                if (colPlAvail == -1 && (h.contains("pl availed") || h.contains("pl avail") || h.contains("pl taken") || h.contains("pl used"))) {
                    colPlAvail = idx;
                }
                if (colLop == -1 && (h.contains("lop") || h.contains("loss of pay"))) {
                    colLop = idx;
                }
                if (colLwd == -1 && (h.contains("last working") || h.contains("lwd"))) {
                    colLwd = idx;
                }
                if (colRemarks == -1 && (h.contains("remark") || h.contains("notes") || h.contains("comment"))) {
                    colRemarks = idx;
                }
                if (h.contains("cl") && !h.contains("after") && !h.contains("add") && !h.contains("avail") && !h.contains("gender") && !h.contains("name")) {
                    if (h.contains("opening") || h.contains("open") || h.contains("sep") || h.contains("prev") || (h.contains("balance") && !h.contains("closing") && !h.contains("close") && !h.contains("oct") && !h.contains("final"))) {
                        if (colClOpen == -1) colClOpen = idx;
                    } else if (h.contains("closing") || h.contains("close") || h.contains("oct") || h.contains("final")) {
                        if (colClClose == -1) colClClose = idx;
                    }
                }
                if (h.contains("pl") && !h.contains("after") && !h.contains("add") && !h.contains("avail") && !h.contains("department")) {
                    if (h.contains("opening") || h.contains("open") || h.contains("sep") || h.contains("prev") || (h.contains("balance") && !h.contains("closing") && !h.contains("close") && !h.contains("oct") && !h.contains("final"))) {
                        if (colPlOpen == -1) colPlOpen = idx;
                    } else if (h.contains("closing") || h.contains("close") || h.contains("oct") || h.contains("final")) {
                        if (colPlClose == -1) colPlClose = idx;
                    }
                }
            }

            if (colEmpCode == -1) colEmpCode = 2;
            if (colClOpen == -1) colClOpen = 7;
            if (colPlOpen == -1) colPlOpen = 8;
            if (colClAdd == -1) colClAdd = 9;
            if (colPlAdd == -1) colPlAdd = 10;
            if (colClAfterAdd == -1) colClAfterAdd = 11;
            if (colPlAfterAdd == -1) colPlAfterAdd = 12;
            if (colClAvail == -1) colClAvail = 13;
            if (colPlAvail == -1) colPlAvail = 14;
            if (colLop == -1) colLop = 15;
            if (colClClose == -1) colClClose = 17;
            if (colPlClose == -1) colPlClose = 18;
            if (colLwd == -1) colLwd = 19;
            if (colRemarks == -1) colRemarks = 20;

            List<MonthlyLeaveBalance> existingRecords = monthlyLeaveBalanceRepository.findByYearAndMonthWithEmployee(year, month);
            Map<Long, MonthlyLeaveBalance> recordByEmpId = new HashMap<>();
            for (MonthlyLeaveBalance r : existingRecords) {
                if (r.getEmployee() != null && r.getEmployee().getId() != null) {
                    recordByEmpId.put(r.getEmployee().getId(), r);
                }
            }

            List<Employee> allEmployees = employeeRepository.findAll();
            Map<String, Employee> empByCode = new HashMap<>();
            for (Employee emp : allEmployees) {
                if (emp.getEmployeeCode() != null) {
                    empByCode.put(emp.getEmployeeCode().trim().toUpperCase(), emp);
                    empByCode.put(normalizeCode(emp.getEmployeeCode()), emp);
                }
            }

            List<MonthlyLeaveBalance> recordsToSave = new ArrayList<>();

            for (int r = headerRowIdx + 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                String empCode = getCellString(row.getCell(colEmpCode));
                if (empCode == null || empCode.isBlank()) continue;

                String normCode = empCode.trim().toUpperCase();
                Employee emp = empByCode.get(normCode);
                if (emp == null) {
                    emp = empByCode.get(normalizeCode(normCode));
                }

                if (emp == null) {
                    errors.add("Row " + (r + 1) + ": Employee not found for code '" + empCode + "'");
                    continue;
                }

                MonthlyLeaveBalance record = recordByEmpId.get(emp.getId());
                boolean isNew = false;
                if (record == null) {
                    record = MonthlyLeaveBalance.builder()
                            .employee(emp)
                            .year(year)
                            .month(month)
                            .build();
                    isNew = true;
                    recordByEmpId.put(emp.getId(), record);
                }

                Double clOpen = getCellNumeric(row.getCell(colClOpen));
                Double plOpen = getCellNumeric(row.getCell(colPlOpen));
                Double clAdd = getCellNumeric(row.getCell(colClAdd));
                Double plAdd = getCellNumeric(row.getCell(colPlAdd));
                Double clAfter = colClAfterAdd != -1 ? getCellNumeric(row.getCell(colClAfterAdd)) : null;
                Double plAfter = colPlAfterAdd != -1 ? getCellNumeric(row.getCell(colPlAfterAdd)) : null;
                Double clAvail = getCellNumeric(row.getCell(colClAvail));
                Double plAvail = getCellNumeric(row.getCell(colPlAvail));
                Double lop = getCellNumeric(row.getCell(colLop));
                Double clClose = colClClose != -1 ? getCellNumeric(row.getCell(colClClose)) : null;
                Double plClose = colPlClose != -1 ? getCellNumeric(row.getCell(colPlClose)) : null;
                String lwd = getCellString(row.getCell(colLwd));
                String remarks = getCellString(row.getCell(colRemarks));

                if (clOpen != null) record.setClOpening(clOpen);
                if (plOpen != null) record.setPlOpening(plOpen);

                if (clAdd == null && clAfter != null && record.getClOpening() != null) {
                    clAdd = Math.max(0.0, Math.round((clAfter - record.getClOpening()) * 10.0) / 10.0);
                }
                if (plAdd == null && plAfter != null && record.getPlOpening() != null) {
                    plAdd = Math.max(0.0, Math.round((plAfter - record.getPlOpening()) * 10.0) / 10.0);
                }

                double[] accrual = calculateMonthlyAccrual(emp, year, month);

                if (clAdd != null) {
                    record.setClAdded(clAdd);
                } else if (isNew) {
                    record.setClAdded(accrual[0]);
                } else {
                    record.setClAdded(0.0);
                }

                if (plAdd != null) {
                    // Enforce 0 PL policy if employee vintage is < 6 months and default 1.5 was passed
                    if (accrual[1] == 0.0 && plAdd == 1.5) {
                        record.setPlAdded(0.0);
                    } else {
                        record.setPlAdded(plAdd);
                    }
                } else if (isNew) {
                    record.setPlAdded(accrual[1]);
                } else {
                    record.setPlAdded(0.0);
                }

                if (clAvail != null) record.setClAvailed(clAvail); else if (isNew) record.setClAvailed(0.0);
                if (plAvail != null) record.setPlAvailed(plAvail); else if (isNew) record.setPlAvailed(0.0);
                if (lop != null) record.setLop(lop); else if (isNew) record.setLop(0.0);
                if (lwd != null) record.setLastWorkingDay(lwd);
                if (remarks != null) record.setRemarks(remarks);

                record.calculateValues();

                if (clClose != null) record.setClClosing(clClose);
                if (plClose != null) record.setPlClosing(plClose);

                recordsToSave.add(record);

                if (isNew) imported++; else updated++;
            }

            if (!recordsToSave.isEmpty()) {
                monthlyLeaveBalanceRepository.saveAll(recordsToSave);
                monthlyLeaveBalanceRepository.flush();

                Set<Long> updatedEmpIds = recordsToSave.stream()
                        .filter(m -> m.getEmployee() != null && m.getEmployee().getId() != null)
                        .map(m -> m.getEmployee().getId())
                        .collect(Collectors.toSet());
                cascadeCarryForward(updatedEmpIds, year, month);
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
                if (cell != null) {
                    String str = getCellString(cell);
                    if (str != null) {
                        str = str.toLowerCase();
                        if (str.contains("emp.code") || str.contains("emp code") || str.contains("gender") || str.contains("empcode")) {
                            return r;
                        }
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
        CellType type = cell.getCellType();
        if (type == CellType.FORMULA) {
            type = cell.getCachedFormulaResultType();
        }
        return switch (type) {
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
        CellType type = cell.getCellType();
        if (type == CellType.FORMULA) {
            type = cell.getCachedFormulaResultType();
        }
        return switch (type) {
            case NUMERIC -> cell.getNumericCellValue();
            case STRING -> {
                try {
                    String s = cell.getStringCellValue().trim();
                    yield s.isEmpty() ? null : Double.parseDouble(s);
                } catch (Exception e) {
                    yield null;
                }
            }
            case BOOLEAN -> cell.getBooleanCellValue() ? 1.0 : 0.0;
            default -> null;
        };
    }
}
