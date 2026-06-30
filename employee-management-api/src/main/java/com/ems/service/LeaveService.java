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
import java.util.Map;
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

        List<LeaveType> leaveTypes = leaveTypeRepository.findByIsActiveTrue();
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
            boolean hasBalances = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                emp.getId(), leaveTypeRepository.findByIsActiveTrue().stream().findFirst().get().getId(), year).isPresent();
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
        balance.setBalance(balance.getEntitled() - balance.getTaken());
        leaveBalanceRepository.save(balance);
        return LeaveBalanceDTO.fromEntity(balance);
    }

    public Page<LeaveApplicationDTO> getLeaveApplications(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (status != null) {
            return leaveApplicationRepository.findByStatus(status, pageable).map(LeaveApplicationDTO::fromEntity);
        }
        return leaveApplicationRepository.findAll(pageable).map(LeaveApplicationDTO::fromEntity);
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

        int days = (int) java.time.temporal.ChronoUnit.DAYS.between(dto.getFromDate(), dto.getToDate()) + 1;
        if (days <= 0) {
            throw new BadRequestException("Leave days must be at least 1");
        }

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

        Integer year = app.getFromDate().getYear();
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                app.getEmployee().getId(), app.getLeaveType().getId(), year)
            .orElseThrow(() -> new BadRequestException("Leave balance not found"));

        balance.setTaken(balance.getTaken() + app.getDays());
        balance.computeBalance();
        leaveBalanceRepository.save(balance);

        app.setStatus("APPROVED");
        app.setApprovedBy(approvedBy);
        app.setApprovedDate(LocalDateTime.now());
        app = leaveApplicationRepository.save(app);

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

        log.info("Leave application {} rejected by {}", applicationId, rejectedBy);
        return LeaveApplicationDTO.fromEntity(app);
    }

    @Transactional
    public void cancelLeave(Long applicationId) {
        LeaveApplication app = leaveApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Leave application not found"));

        if ("APPROVED".equals(app.getStatus())) {
            Integer year = app.getFromDate().getYear();
            LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                app.getEmployee().getId(), app.getLeaveType().getId(), year).orElse(null);
            if (balance != null) {
                balance.setTaken(Math.max(0, balance.getTaken() - app.getDays()));
                balance.computeBalance();
                leaveBalanceRepository.save(balance);
            }
        }

        app.setStatus("CANCELLED");
        leaveApplicationRepository.save(app);
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
}
