package com.ems.service;

import com.ems.dto.LeaveApplicationDTO;
import com.ems.dto.LeaveBalanceDTO;
import com.ems.exception.BadRequestException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.*;
import com.ems.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeaveService {

    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveApplicationRepository leaveApplicationRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveExcelService leaveExcelService;
    private final AttendanceRepository attendanceRepository;
    private final CompOffService compOffService;

    public List<LeaveType> getLeaveTypes() {
        return leaveTypeRepository.findByIsActiveTrueOrderByPriorityAscIdAsc();
    }

    public List<LeaveType> getAllLeaveTypesOrdered() {
        return leaveTypeRepository.findAllByOrderByPriorityAscIdAsc();
    }

    @Transactional
    public LeaveType createLeaveType(LeaveType leaveType) {
        if (leaveType.getPriority() == null) {
            leaveType.setPriority(1);
        }
        return leaveTypeRepository.save(leaveType);
    }

    @Transactional
    public LeaveType updateLeaveType(Long id, LeaveType updated) {
        LeaveType lt = leaveTypeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Leave type not found: " + id));
        if (updated.getName() != null) lt.setName(updated.getName());
        if (updated.getDescription() != null) lt.setDescription(updated.getDescription());
        if (updated.getAnnualEntitlement() != null) lt.setAnnualEntitlement(updated.getAnnualEntitlement());
        if (updated.getIsCarryForward() != null) lt.setIsCarryForward(updated.getIsCarryForward());
        if (updated.getIsActive() != null) lt.setIsActive(updated.getIsActive());
        if (updated.getPriority() != null) lt.setPriority(updated.getPriority());
        return leaveTypeRepository.save(lt);
    }

    @Transactional
    public List<LeaveBalanceDTO> getLeaveBalances(Long employeeId, Integer year) {
        if (year == null) {
            year = 2026;
        }
        if (employeeId != null) {
            List<LeaveBalance> balances = leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, year);
            if (balances.isEmpty()) {
                initializeLeaveBalances(employeeId, year);
                balances = leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, year);
            }
            return balances.stream()
                .map(LeaveBalanceDTO::fromEntity)
                .collect(Collectors.toList());
        }
        List<LeaveBalance> balances = leaveBalanceRepository.findByYear(year);
        if (balances.isEmpty()) {
            initializeAllLeaveBalances(year);
            balances = leaveBalanceRepository.findByYear(year);
        }
        return balances.stream()
            .map(LeaveBalanceDTO::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional
    public void initializeLeaveBalances(Long employeeId, Integer year) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        List<LeaveType> leaveTypes = leaveTypeRepository.findByIsActiveTrueOrderByPriorityAscIdAsc();
        for (LeaveType lt : leaveTypes) {
            if (leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(employeeId, lt.getId(), year).isEmpty()) {
                int entitled = "CO".equalsIgnoreCase(lt.getName()) ? 0 : (lt.getAnnualEntitlement() != null ? lt.getAnnualEntitlement() : 0);
                LeaveBalance balance = LeaveBalance.builder()
                    .employee(employee)
                    .leaveType(lt)
                    .year(year)
                    .entitled(entitled)
                    .taken(0)
                    .balance(entitled)
                    .build();
                leaveBalanceRepository.save(balance);
            }
        }
    }

    @Transactional
    public int initializeAllLeaveBalances(Integer year) {
        List<Employee> employees = employeeRepository.findAll();
        List<LeaveType> activeTypes = leaveTypeRepository.findByIsActiveTrueOrderByPriorityAscIdAsc();
        int count = 0;
        for (Employee emp : employees) {
            for (LeaveType lt : activeTypes) {
                if (leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(emp.getId(), lt.getId(), year).isEmpty()) {
                    int entitled = "CO".equalsIgnoreCase(lt.getName()) ? 0 : (lt.getAnnualEntitlement() != null ? lt.getAnnualEntitlement() : 0);
                    LeaveBalance balance = LeaveBalance.builder()
                        .employee(emp)
                        .leaveType(lt)
                        .year(year)
                        .entitled(entitled)
                        .taken(0)
                        .balance(entitled)
                        .build();
                    leaveBalanceRepository.save(balance);
                    count++;
                }
            }
        }
        return count;
    }

    @Transactional
    public LeaveBalanceDTO updateLeaveBalance(Long id, LeaveBalanceDTO dto) {
        LeaveBalance balance = leaveBalanceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Leave balance not found"));
        if (dto.getEntitled() != null) balance.setEntitled(dto.getEntitled());
        if (dto.getTaken() != null) balance.setTaken(dto.getTaken());
        balance.computeBalance();
        leaveBalanceRepository.save(balance);
        return LeaveBalanceDTO.fromEntity(balance);
    }

    public Page<LeaveApplicationDTO> getLeaveApplications(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (status != null) {
            return leaveApplicationRepository.findByStatusOrdered(status, pageable).map(LeaveApplicationDTO::fromEntity);
        }
        return leaveApplicationRepository.findAllOrdered(pageable).map(LeaveApplicationDTO::fromEntity);
    }

    public List<LeaveApplicationDTO> getLeaveApplicationsByEmployee(Long employeeId) {
        return leaveApplicationRepository.findByEmployeeIdAndYear(employeeId, LocalDate.now().getYear()).stream()
            .map(LeaveApplicationDTO::fromEntity)
            .collect(Collectors.toList());
    }

    public List<LeaveApplicationDTO> getLeaveApplicationsByMonth(Integer year, Integer month) {
        return leaveApplicationRepository.findByMonth(year, month).stream()
            .map(LeaveApplicationDTO::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional
    public LeaveApplicationDTO applyLeave(LeaveApplicationDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        LeaveType leaveType = leaveTypeRepository.findById(dto.getLeaveTypeId())
            .orElseThrow(() -> new ResourceNotFoundException("Leave type not found"));

        if (dto.getFromDate().isAfter(dto.getToDate())) {
            throw new BadRequestException("From date cannot be after To date");
        }

        if (leaveApplicationRepository.existsOverlapping(dto.getEmployeeId(), dto.getFromDate(), dto.getToDate())) {
            throw new BadRequestException("You already have a leave application covering some of these dates");
        }

        int days = (int) java.time.temporal.ChronoUnit.DAYS.between(dto.getFromDate(), dto.getToDate()) + 1;
        if (days <= 0) {
            throw new BadRequestException("Leave days must be at least 1");
        }

        if ("CO".equalsIgnoreCase(leaveType.getName())) {
            long available = compOffService.getAvailableCount(employee.getId());
            if (available == 0) {
                throw new BadRequestException("No Comp-Off balance available");
            }
            if (days > available) {
                throw new BadRequestException("Insufficient Comp-Off balance. Available: " + available + " day(s), Requested: " + days + " day(s)");
            }
        } else {
            Integer year = dto.getFromDate().getYear();
            LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                    employee.getId(), leaveType.getId(), year)
                .orElseGet(() -> {
                    initializeLeaveBalances(employee.getId(), year);
                    return leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                        employee.getId(), leaveType.getId(), year)
                        .orElseThrow(() -> new BadRequestException("Leave balance not initialized for this year"));
                });

            boolean isLop = balance.getBalance() < days;
            if (isLop) {
                if (dto.getReason() != null && (dto.getReason().contains("[ALLOW_LOP]") || dto.getReason().contains("LOP"))) {
                    // Allowed with LOP
                } else {
                    throw new BadRequestException("NO_LEAVE_AVAILABLE: Insufficient leave balance for " + leaveType.getName() + ". Available: " + balance.getBalance() + " day(s), Requested: " + days + " day(s). Approval will result in Loss of Pay (LOP).");
                }
            }
        }

        String finalReason = dto.getReason() != null ? dto.getReason().replace("[ALLOW_LOP]", "").trim() : "";
        LeaveBalance balCheck = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                employee.getId(), leaveType.getId(), dto.getFromDate().getYear()).orElse(null);
        if (balCheck != null && balCheck.getBalance() < days && !finalReason.contains("LOP")) {
            finalReason += " (Loss of Pay / LOP)";
        }

        LeaveApplication app = LeaveApplication.builder()
            .employee(employee)
            .leaveType(leaveType)
            .fromDate(dto.getFromDate())
            .toDate(dto.getToDate())
            .days(days)
            .reason(finalReason)
            .status("PENDING")
            .appliedDate(LocalDateTime.now())
            .build();

        app = leaveApplicationRepository.save(app);
        log.info("Leave application created: {} days {} for employee {}", days, leaveType.getName(), employee.getEmployeeCode());
        return LeaveApplicationDTO.fromEntity(app);
    }

    public List<LeaveBalanceDTO> getLopBalances(Integer year) {
        if (year == null) year = LocalDate.now().getYear();
        return leaveBalanceRepository.findByYear(year).stream()
            .filter(lb -> lb.getBalance() != null && lb.getBalance() < 0)
            .map(LeaveBalanceDTO::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional
    public void autoApplyLeaveForAttendance(Employee employee, LocalDate date) {
        if (employee == null || date == null) return;
        if (leaveApplicationRepository.existsOverlapping(employee.getId(), date, date)) {
            return;
        }

        Integer year = date.getYear();
        initializeLeaveBalances(employee.getId(), year);

        List<LeaveType> prioritizedTypes = leaveTypeRepository.findByIsActiveTrueOrderByPriorityAscIdAsc();
        LeaveType selectedType = null;
        boolean isLopAuto = false;

        for (LeaveType lt : prioritizedTypes) {
            if ("CO".equalsIgnoreCase(lt.getName())) {
                long availableCo = compOffService.getAvailableCount(employee.getId());
                if (availableCo > 0) {
                    selectedType = lt;
                    break;
                }
            } else {
                Optional<LeaveBalance> balOpt = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(employee.getId(), lt.getId(), year);
                if (balOpt.isPresent() && balOpt.get().getBalance() > 0) {
                    selectedType = lt;
                    break;
                }
            }
        }

        if (selectedType == null && !prioritizedTypes.isEmpty()) {
            selectedType = prioritizedTypes.get(0);
            isLopAuto = true;
        }

        if (selectedType != null) {
            String autoReason = isLopAuto 
                ? "Auto-applied Loss of Pay (LOP) - No leave balance available from Attendance (L) on " + date
                : "Auto-applied leave from Attendance (L) on " + date;

            LeaveApplication app = LeaveApplication.builder()
                .employee(employee)
                .leaveType(selectedType)
                .fromDate(date)
                .toDate(date)
                .days(1)
                .reason(autoReason)
                .status("PENDING")
                .appliedDate(LocalDateTime.now())
                .build();
            leaveApplicationRepository.save(app);
            log.info("Auto-applied PENDING leave ({}, LOP={}) for employee {} on date {}", selectedType.getName(), isLopAuto, employee.getEmployeeCode(), date);
        }
    }

    @Transactional
    public LeaveApplicationDTO approveLeave(Long applicationId, String approvedBy) {
        LeaveApplication app = leaveApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Leave application not found"));

        if (!"PENDING".equals(app.getStatus())) {
            throw new BadRequestException("Only pending applications can be approved");
        }

        Integer year = app.getFromDate().getYear();
        initializeLeaveBalances(app.getEmployee().getId(), year);

        LeaveType targetType = app.getLeaveType();
        int days = app.getDays();
        
        // Check if target type has sufficient balance
        boolean targetHasBalance = false;
        if ("CO".equalsIgnoreCase(targetType.getName())) {
            targetHasBalance = compOffService.getAvailableCount(app.getEmployee().getId()) >= days;
        } else {
            Optional<LeaveBalance> targetBal = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                app.getEmployee().getId(), targetType.getId(), year);
            targetHasBalance = targetBal.isPresent() && targetBal.get().getBalance() >= days;
        }

        // If target type does NOT have sufficient balance, find the highest-priority leave type that HAS balance!
        if (!targetHasBalance) {
            List<LeaveType> prioritizedTypes = leaveTypeRepository.findByIsActiveTrueOrderByPriorityAscIdAsc();
            for (LeaveType lt : prioritizedTypes) {
                if ("CO".equalsIgnoreCase(lt.getName())) {
                    if (compOffService.getAvailableCount(app.getEmployee().getId()) >= days) {
                        targetType = lt;
                        targetHasBalance = true;
                        break;
                    }
                } else {
                    Optional<LeaveBalance> balOpt = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                        app.getEmployee().getId(), lt.getId(), year);
                    if (balOpt.isPresent() && balOpt.get().getBalance() >= days) {
                        targetType = lt;
                        targetHasBalance = true;
                        break;
                    }
                }
            }
            if (!targetHasBalance) {
                for (LeaveType lt : prioritizedTypes) {
                    if ("CO".equalsIgnoreCase(lt.getName())) {
                        if (compOffService.getAvailableCount(app.getEmployee().getId()) > 0) {
                            targetType = lt;
                            targetHasBalance = true;
                            break;
                        }
                    } else {
                        Optional<LeaveBalance> balOpt = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                            app.getEmployee().getId(), lt.getId(), year);
                        if (balOpt.isPresent() && balOpt.get().getBalance() > 0) {
                            targetType = lt;
                            targetHasBalance = true;
                            break;
                        }
                    }
                }
            }
        }

        if (!targetType.getId().equals(app.getLeaveType().getId())) {
            log.info("Switching leave application {} type from {} to {} due to Master Priority balance availability",
                app.getId(), app.getLeaveType().getName(), targetType.getName());
            app.setLeaveType(targetType);
        }

        if ("CO".equalsIgnoreCase(targetType.getName())) {
            for (LocalDate d = app.getFromDate(); !d.isAfter(app.getToDate()); d = d.plusDays(1)) {
                compOffService.recordCompOffAvailed(app.getEmployee(), d);
            }
        } else {
            final Long finalEmpId = app.getEmployee().getId();
            final Long finalLtId = targetType.getId();
            LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                    finalEmpId, finalLtId, year)
                .orElseGet(() -> {
                    initializeLeaveBalances(finalEmpId, year);
                    return leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                        finalEmpId, finalLtId, year).orElseThrow();
                });

            balance.setTaken(balance.getTaken() + days);
            balance.computeBalance();
            leaveBalanceRepository.save(balance);

            leaveExcelService.updateAvailed(
                app.getEmployee().getEmployeeCode(),
                targetType.getName(),
                days,
                app.getFromDate().getMonthValue(),
                app.getFromDate().getYear()
            );
        }

        app.setStatus("APPROVED");
        app.setApprovedBy(approvedBy);
        app.setApprovedDate(LocalDateTime.now());
        app = leaveApplicationRepository.save(app);
        syncAttendanceFromLeave(app);

        log.info("Leave application {} approved as {} by {}", applicationId, targetType.getName(), approvedBy);
        return LeaveApplicationDTO.fromEntity(app);
    }

    @Transactional
    public LeaveApplicationDTO rejectLeave(Long applicationId, String rejectedBy) {
        LeaveApplication app = leaveApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Leave application not found"));

        if (!"PENDING".equals(app.getStatus()) && !"APPROVED".equals(app.getStatus())) {
            throw new BadRequestException("Only pending or approved applications can be rejected");
        }

        if ("APPROVED".equals(app.getStatus())) {
            revertLeaveBalanceFull(app);
        }

        app.setStatus("REJECTED");
        app.setApprovedBy(rejectedBy);
        app.setApprovedDate(LocalDateTime.now());
        app = leaveApplicationRepository.save(app);
        removeAttendanceFromLeave(app);

        log.info("Leave application {} rejected by {}. Restored balance and reset attendance to P", applicationId, rejectedBy);
        return LeaveApplicationDTO.fromEntity(app);
    }

    @Transactional
    public void cancelLeave(Long applicationId) {
        LeaveApplication app = leaveApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Leave application not found"));

        if ("APPROVED".equals(app.getStatus())) {
            revertLeaveBalanceFull(app);
        }

        app.setStatus("CANCELLED");
        leaveApplicationRepository.save(app);
        removeAttendanceFromLeave(app);
        log.info("Leave application {} cancelled", applicationId);
    }

    private void revertLeaveBalanceFull(LeaveApplication app) {
        if ("CO".equalsIgnoreCase(app.getLeaveType().getName())) {
            for (LocalDate d = app.getFromDate(); !d.isAfter(app.getToDate()); d = d.plusDays(1)) {
                compOffService.cancelCompOffAvailed(app.getEmployee(), d);
            }
        } else {
            Integer year = app.getFromDate().getYear();
            LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                    app.getEmployee().getId(), app.getLeaveType().getId(), year)
                .orElse(null);
            if (balance != null) {
                balance.setTaken(Math.max(0, balance.getTaken() - app.getDays()));
                balance.computeBalance();
                leaveBalanceRepository.save(balance);
            }
        }
    }

    @Transactional
    public void cancelLeaveIfOwn(Long applicationId, Long employeeId) {
        LeaveApplication app = leaveApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Leave application not found"));
        if (!app.getEmployee().getId().equals(employeeId)) {
            throw new BadRequestException("You can only cancel your own leave applications");
        }
        cancelLeave(applicationId);
    }

    public List<LeaveApplicationDTO> getLeaveApplicationsByDateRange(LocalDate from, LocalDate to) {
        return leaveApplicationRepository.findByDateRange(from, to).stream()
            .map(LeaveApplicationDTO::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional
    public void updateBalanceByEmployee(String employeeCode, String leaveTypeName, Integer year, Integer entitled, Integer taken) {
        if ("CO".equalsIgnoreCase(leaveTypeName)) return;

        Employee employee = employeeRepository.findByEmployeeCode(employeeCode)
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + employeeCode));
        LeaveType leaveType = leaveTypeRepository.findByName(leaveTypeName)
            .orElseThrow(() -> new ResourceNotFoundException("Leave type not found: " + leaveTypeName));
        LeaveBalance balance = leaveBalanceRepository
            .findByEmployeeIdAndLeaveTypeIdAndYear(employee.getId(), leaveType.getId(), year)
            .orElseGet(() -> {
                LeaveBalance newBal = LeaveBalance.builder()
                    .employee(employee)
                    .leaveType(leaveType)
                    .year(year)
                    .entitled(0)
                    .taken(0)
                    .balance(0)
                    .build();
                return leaveBalanceRepository.save(newBal);
            });
        balance.setEntitled(entitled);
        balance.setTaken(taken);
        balance.computeBalance();
        leaveBalanceRepository.save(balance);
    }

    @Transactional
    public void clearAllLeaveBalances() {
        log.warn("Clearing ALL leave balance records from DB");
        leaveBalanceRepository.deleteAll();
    }

    private void syncAttendanceFromLeave(LeaveApplication app) {
        String status = "CO".equalsIgnoreCase(app.getLeaveType().getName()) ? "COT" :
            isMedicalLeave(app.getLeaveType()) ? "ML" : "L";
        for (LocalDate d = app.getFromDate(); !d.isAfter(app.getToDate()); d = d.plusDays(1)) {
            final LocalDate day = d;
            AttendanceRecord record = attendanceRepository
                .findByEmployeeIdAndAttendanceDate(app.getEmployee().getId(), day)
                .orElseGet(() -> AttendanceRecord.builder()
                    .employee(app.getEmployee())
                    .attendanceDate(day)
                    .build());
            record.setStatus(status);
            record.setLocked(true);
            attendanceRepository.save(record);
        }
        log.info("Marked {} as {} in attendance for employee {} ({}-{})",
            app.getDays(), status, app.getEmployee().getEmployeeCode(), app.getFromDate(), app.getToDate());
    }

    @Transactional
    public void handleAttendanceEditToNonLeave(Employee employee, LocalDate date, String newStatus) {
        if (employee == null || date == null) return;
        List<LeaveApplication> apps = leaveApplicationRepository.findOverlappingForEmployeeAndDate(employee.getId(), date);
        for (LeaveApplication app : apps) {
            if ("APPROVED".equals(app.getStatus())) {
                revertLeaveBalanceForDate(app, date);
                app.setStatus("CANCELLED");
                app.setReason((app.getReason() != null ? app.getReason() : "") + " (Auto-cancelled due to Attendance edit to " + newStatus + ")");
                leaveApplicationRepository.save(app);
                log.info("Reverted 1 day leave balance & cancelled leave application {} for employee {} on date {}",
                    app.getId(), employee.getEmployeeCode(), date);
            } else if ("PENDING".equals(app.getStatus())) {
                app.setStatus("REJECTED");
                app.setReason((app.getReason() != null ? app.getReason() : "") + " (Auto-rejected due to Attendance edit to " + newStatus + ")");
                leaveApplicationRepository.save(app);
                log.info("Auto-rejected pending leave application {} for employee {} on date {}",
                    app.getId(), employee.getEmployeeCode(), date);
            }
        }
    }

    private void revertLeaveBalanceForDate(LeaveApplication app, LocalDate date) {
        if ("CO".equalsIgnoreCase(app.getLeaveType().getName())) {
            compOffService.cancelCompOffAvailed(app.getEmployee(), date);
        } else {
            Integer year = date.getYear();
            LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                    app.getEmployee().getId(), app.getLeaveType().getId(), year)
                .orElse(null);
            if (balance != null) {
                balance.setTaken(Math.max(0, balance.getTaken() - 1));
                balance.computeBalance();
                leaveBalanceRepository.save(balance);
            }
        }
    }

    private void removeAttendanceFromLeave(LeaveApplication app) {
        int updatedCount = 0;
        for (LocalDate d = app.getFromDate(); !d.isAfter(app.getToDate()); d = d.plusDays(1)) {
            final LocalDate currentDay = d;
            AttendanceRecord record = attendanceRepository
                .findByEmployeeIdAndAttendanceDate(app.getEmployee().getId(), currentDay)
                .orElseGet(() -> AttendanceRecord.builder()
                    .employee(app.getEmployee())
                    .attendanceDate(currentDay)
                    .build());
            record.setStatus(""); // Set explicitly to empty string so cell shows blank
            record.setLocked(false);
            attendanceRepository.save(record);
            updatedCount++;
        }
        log.info("Reset {} attendance day(s) to empty blank for employee {} ({}-{})",
            updatedCount, app.getEmployee().getEmployeeCode(), app.getFromDate(), app.getToDate());
    }

    private boolean isMedicalLeave(LeaveType leaveType) {
        if (leaveType == null || leaveType.getName() == null) return false;
        String name = leaveType.getName().toUpperCase();
        return name.equals("SL") || name.contains("SICK") || name.contains("MEDICAL");
    }
}
