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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

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
            encashments = encashmentRepository.findAll();
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

        // Deduct from leave balance
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

        // Update Excel availed column
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
}
