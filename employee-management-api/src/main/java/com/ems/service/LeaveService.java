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
        return leaveTypeRepository.findByIsActiveTrue();
    }

    @Transactional
    public LeaveType createLeaveType(LeaveType leaveType) {
        return leaveTypeRepository.save(leaveType);
    }

    public List<LeaveBalanceDTO> getLeaveBalances(Long employeeId, Integer year) {
        if (employeeId != null) {
            return leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, year).stream()
                .map(LeaveBalanceDTO::fromEntity)
                .collect(Collectors.toList());
        }
        return leaveBalanceRepository.findByYear(year).stream()
            .map(LeaveBalanceDTO::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional
    public void initializeLeaveBalances(Long employeeId, Integer year) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        List<LeaveType> leaveTypes = leaveTypeRepository.findByIsActiveTrue().stream()
            .filter(lt -> !"CO".equals(lt.getName()))
            .collect(Collectors.toList());
        for (LeaveType lt : leaveTypes) {
            if (leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(employeeId, lt.getId(), year).isEmpty()) {
                LeaveBalance balance = LeaveBalance.builder()
                    .employee(employee)
                    .leaveType(lt)
                    .year(year)
                    .entitled(lt.getAnnualEntitlement())
                    .taken(0)
                    .balance(lt.getAnnualEntitlement())
                    .build();
                leaveBalanceRepository.save(balance);
            }
        }
    }

    @Transactional
    public int initializeAllLeaveBalances(Integer year) {
        List<Employee> employees = employeeRepository.findAll();
        int count = 0;
        for (Employee emp : employees) {
            LeaveType firstType = leaveTypeRepository.findByIsActiveTrue().stream()
                .filter(lt -> !"CO".equals(lt.getName()))
                .findFirst().orElse(null);
            if (firstType == null) continue;
            boolean hasBalances = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                emp.getId(), firstType.getId(), year).isPresent();
            if (!hasBalances) {
                initializeLeaveBalances(emp.getId(), year);
                count++;
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

        if ("CO".equals(leaveType.getName())) {
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

            if (balance.getBalance() < days) {
                throw new BadRequestException("Insufficient leave balance. Available: " + balance.getBalance() + " days");
            }
        }

        LeaveApplication app = LeaveApplication.builder()
            .employee(employee)
            .leaveType(leaveType)
            .fromDate(dto.getFromDate())
            .toDate(dto.getToDate())
            .days(days)
            .reason(dto.getReason())
            .status("PENDING")
            .appliedDate(LocalDateTime.now())
            .build();

        app = leaveApplicationRepository.save(app);
        syncAttendanceFromLeave(app);
        log.info("Leave application created: {} days {} for employee {}", days, leaveType.getName(), employee.getEmployeeCode());
        return LeaveApplicationDTO.fromEntity(app);
    }

    @Transactional
    public LeaveApplicationDTO approveLeave(Long applicationId, String approvedBy) {
        LeaveApplication app = leaveApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Leave application not found"));

        if (!"PENDING".equals(app.getStatus())) {
            throw new BadRequestException("Only pending applications can be approved");
        }

        if ("CO".equals(app.getLeaveType().getName())) {
            for (int i = 0; i < app.getDays(); i++) {
                compOffService.availOneCompOff(app.getEmployee().getId());
            }
        } else {
            Integer year = app.getFromDate().getYear();
            LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                    app.getEmployee().getId(), app.getLeaveType().getId(), year)
                .orElseThrow(() -> new BadRequestException("Leave balance not found"));

            balance.setTaken(balance.getTaken() + app.getDays());
            balance.computeBalance();
            leaveBalanceRepository.save(balance);

            leaveExcelService.updateAvailed(
                app.getEmployee().getEmployeeCode(),
                app.getLeaveType().getName(),
                app.getDays(),
                app.getFromDate().getMonthValue(),
                app.getFromDate().getYear()
            );
        }

        app.setStatus("APPROVED");
        app.setApprovedBy(approvedBy);
        app.setApprovedDate(LocalDateTime.now());
        app = leaveApplicationRepository.save(app);
        syncAttendanceFromLeave(app);

        log.info("Leave application {} approved by {}", applicationId, approvedBy);
        return LeaveApplicationDTO.fromEntity(app);
    }

    @Transactional
    public LeaveApplicationDTO rejectLeave(Long applicationId, String rejectedBy) {
        LeaveApplication app = leaveApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Leave application not found"));

        if (!"PENDING".equals(app.getStatus())) {
            throw new BadRequestException("Only pending applications can be rejected");
        }

        app.setStatus("REJECTED");
        app.setApprovedBy(rejectedBy);
        app.setApprovedDate(LocalDateTime.now());
        app = leaveApplicationRepository.save(app);

        removeAttendanceFromLeave(app);
        log.info("Leave application {} rejected by {}", applicationId, rejectedBy);
        return LeaveApplicationDTO.fromEntity(app);
    }

    @Transactional
    public void cancelLeave(Long applicationId) {
        LeaveApplication app = leaveApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Leave application not found"));

        if ("APPROVED".equals(app.getStatus())) {
            if ("CO".equals(app.getLeaveType().getName())) {
                for (int i = 0; i < app.getDays(); i++) {
                    compOffService.restoreOneCompOff(app.getEmployee().getId());
                }
            } else {
                Integer year = app.getFromDate().getYear();
                LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                    app.getEmployee().getId(), app.getLeaveType().getId(), year).orElse(null);
                if (balance != null) {
                    balance.setTaken(Math.max(0, balance.getTaken() - app.getDays()));
                    balance.computeBalance();
                    leaveBalanceRepository.save(balance);

                    leaveExcelService.restoreAvailed(
                        app.getEmployee().getEmployeeCode(),
                        app.getLeaveType().getName(),
                        app.getDays(),
                        app.getFromDate().getMonthValue(),
                        app.getFromDate().getYear()
                    );
                }
            }
        }

        app.setStatus("CANCELLED");
        leaveApplicationRepository.save(app);
        removeAttendanceFromLeave(app);
    }

    @Transactional
    public void cancelLeaveIfOwn(Long applicationId, Long employeeId) {
        LeaveApplication app = leaveApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Leave application not found"));
        if (!app.getEmployee().getId().equals(employeeId)) {
            throw new com.ems.exception.BadRequestException("You can only cancel your own leave applications");
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
        String status = "CO".equals(app.getLeaveType().getName()) ? "CO" :
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

    private void removeAttendanceFromLeave(LeaveApplication app) {
        int removed = 0;
        for (LocalDate d = app.getFromDate(); !d.isAfter(app.getToDate()); d = d.plusDays(1)) {
            Optional<AttendanceRecord> existing = attendanceRepository
                .findByEmployeeIdAndAttendanceDate(app.getEmployee().getId(), d);
            if (existing.isPresent()) {
                String s = existing.get().getStatus();
                if ("L".equals(s) || "ML".equals(s) || "CO".equals(s)) {
                    attendanceRepository.delete(existing.get());
                    removed++;
                }
            }
        }
        log.info("Removed {} leave day(s) from attendance for employee {} ({}-{})",
            removed, app.getEmployee().getEmployeeCode(), app.getFromDate(), app.getToDate());
    }

    private boolean isMedicalLeave(LeaveType leaveType) {
        if (leaveType == null || leaveType.getName() == null) return false;
        String name = leaveType.getName().toUpperCase();
        return name.equals("SL") || name.contains("SICK") || name.contains("MEDICAL");
    }
}
