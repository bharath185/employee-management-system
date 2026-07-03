package com.ems.service;

import com.ems.dto.SalaryMasterDTO;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.Employee;
import com.ems.model.SalaryMaster;
import com.ems.model.SalaryMasterHistory;
import com.ems.model.SalaryMasterSnapshot;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.SalaryMasterHistoryRepository;
import com.ems.repository.SalaryMasterRepository;
import com.ems.repository.SalaryMasterSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SalaryMasterService {

    private final SalaryMasterRepository salaryMasterRepository;
    private final SalaryMasterHistoryRepository historyRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryMasterSnapshotRepository snapshotRepository;

    @Transactional(readOnly = true)
    public List<SalaryMasterDTO> getAll() {
        return salaryMasterRepository.findAllByOrderByEmployeeAsc().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SalaryMasterDTO getByEmployeeId(Long employeeId) {
        SalaryMaster master = salaryMasterRepository.findByEmployeeId(employeeId)
            .orElseThrow(() -> new ResourceNotFoundException("Salary master not found for employee " + employeeId));
        return toDTO(master);
    }

    @Transactional
    public SalaryMasterDTO saveOrUpdate(SalaryMasterDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + dto.getEmployeeId()));

        String currentUser = getCurrentUser();

        SalaryMaster master = salaryMasterRepository.findByEmployeeId(dto.getEmployeeId())
            .orElseGet(() -> SalaryMaster.builder()
                .employee(employee)
                .build());

        // Track changes for history
        trackChanges(master, dto, currentUser);

        master.setBasic(safe(dto.getBasic()));
        master.setHra(safe(dto.getHra()));
        master.setFixedPersonalAllowance(safe(dto.getFixedPersonalAllowance()));
        master.setOtherAllowance(safe(dto.getOtherAllowance()));
        master.setBonus(safe(dto.getBonus()));
        master.setAppraisalAmount(safe(dto.getAppraisalAmount()));
        master.setLateSittingAmount(safe(dto.getLateSittingAmount()));
        master.setPfDeduction(safe(dto.getPfDeduction()));
        master.setEsiDeduction(safe(dto.getEsiDeduction()));
        master.setPtDeduction(safe(dto.getPtDeduction()));
        master.setOvertimeWages(safe(dto.getOvertimeWages()));
        if (dto.getWorkingHoursPerDay() != null) master.setWorkingHoursPerDay(dto.getWorkingHoursPerDay());
        if (dto.getWeeklyOff() != null) master.setWeeklyOff(dto.getWeeklyOff());
        if (dto.getWorkerType() != null) master.setWorkerType(dto.getWorkerType());
        if (dto.getEffectiveFrom() != null) master.setEffectiveFrom(dto.getEffectiveFrom());

        master = salaryMasterRepository.save(master);

        // Save monthly snapshot for historical review
        takeSnapshot(master, currentUser);

        log.info("Salary master saved for employee {}", employee.getEmployeeCode());
        return toDTO(master);
    }

    private void takeSnapshot(SalaryMaster master, String user) {
        java.time.LocalDate now = java.time.LocalDate.now();
        SalaryMasterSnapshot snapshot = SalaryMasterSnapshot.builder()
            .employeeId(master.getEmployee().getId())
            .employeeCode(master.getEmployee().getEmployeeCode())
            .snapshotYear(now.getYear())
            .snapshotMonth(now.getMonthValue())
            .basic(master.getBasic())
            .hra(master.getHra())
            .fixedPersonalAllowance(master.getFixedPersonalAllowance())
            .otherAllowance(master.getOtherAllowance())
            .bonus(master.getBonus())
            .appraisalAmount(master.getAppraisalAmount())
            .lateSittingAmount(master.getLateSittingAmount())
            .pfDeduction(master.getPfDeduction())
            .esiDeduction(master.getEsiDeduction())
            .ptDeduction(master.getPtDeduction())
            .overtimeWages(master.getOvertimeWages())
            .workingHoursPerDay(master.getWorkingHoursPerDay())
            .workerType(master.getWorkerType())
            .changedBy(user)
            .createdAt(java.time.LocalDateTime.now())
            .build();
        snapshotRepository.save(snapshot);
        log.info("Salary master snapshot saved for employee {} for {}/{}",
            master.getEmployee().getEmployeeCode(), now.getMonthValue(), now.getYear());
    }

    @Transactional
    public SalaryMasterDTO initForEmployee(Long employeeId) {
        if (salaryMasterRepository.existsByEmployeeId(employeeId)) {
            return getByEmployeeId(employeeId);
        }
        SalaryMasterDTO dto = SalaryMasterDTO.builder()
            .employeeId(employeeId)
            .basic(BigDecimal.ZERO)
            .hra(BigDecimal.ZERO)
            .fixedPersonalAllowance(BigDecimal.ZERO)
            .otherAllowance(BigDecimal.ZERO)
            .bonus(BigDecimal.ZERO)
            .appraisalAmount(BigDecimal.ZERO)
            .lateSittingAmount(BigDecimal.ZERO)
            .pfDeduction(BigDecimal.ZERO)
            .esiDeduction(BigDecimal.ZERO)
            .ptDeduction(BigDecimal.ZERO)
            .overtimeWages(BigDecimal.ZERO)
            .workingHoursPerDay(8)
            .weeklyOff("Allowed")
            .workerType("Permanent")
            .build();
        return saveOrUpdate(dto);
    }

    public List<SalaryMasterHistory> getHistory(Long employeeId) {
        return historyRepository.findByEmployeeIdOrderByChangedAtDesc(employeeId);
    }

    @Transactional(readOnly = true)
    public List<SalaryMasterSnapshot> getSnapshots(Long employeeId) {
        return snapshotRepository.findByEmployeeIdOrderBySnapshotYearDescSnapshotMonthDesc(employeeId);
    }

    private void trackChanges(SalaryMaster master, SalaryMasterDTO dto, String user) {
        if (master.getId() == null) return; // new record, no history

        LocalDateTime now = LocalDateTime.now();
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(),
            "basic", master.getBasic(), dto.getBasic(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(),
            "hra", master.getHra(), dto.getHra(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(),
            "bonus", master.getBonus(), dto.getBonus(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(),
            "appraisalAmount", master.getAppraisalAmount(), dto.getAppraisalAmount(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(),
            "lateSittingAmount", master.getLateSittingAmount(), dto.getLateSittingAmount(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(),
            "pfDeduction", master.getPfDeduction(), dto.getPfDeduction(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(),
            "esiDeduction", master.getEsiDeduction(), dto.getEsiDeduction(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(),
            "ptDeduction", master.getPtDeduction(), dto.getPtDeduction(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(),
            "fixedPersonalAllowance", master.getFixedPersonalAllowance(), dto.getFixedPersonalAllowance(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(),
            "otherAllowance", master.getOtherAllowance(), dto.getOtherAllowance(), user, now);
        trackField(master.getId(), master.getEmployee().getId(), master.getEmployee().getEmployeeCode(),
            "overtimeWages", master.getOvertimeWages(), dto.getOvertimeWages(), user, now);
    }

    private void trackField(Long masterId, Long empId, String empCode, String field,
                            BigDecimal oldVal, BigDecimal newVal, String user, LocalDateTime now) {
        if (oldVal == null && newVal == null) return;
        if (oldVal != null && newVal != null && oldVal.compareTo(newVal) == 0) return;
        historyRepository.save(SalaryMasterHistory.builder()
            .salaryMasterId(masterId)
            .employeeId(empId)
            .employeeCode(empCode)
            .fieldName(field)
            .oldValue(oldVal != null ? oldVal.toPlainString() : null)
            .newValue(newVal != null ? newVal.toPlainString() : null)
            .changedBy(user)
            .changedAt(now)
            .build());
    }

    private SalaryMasterDTO toDTO(SalaryMaster master) {
        return SalaryMasterDTO.builder()
            .id(master.getId())
            .employeeId(master.getEmployee().getId())
            .employeeCode(master.getEmployee().getEmployeeCode())
            .employeeName(master.getEmployee().getFirstName() + " " + master.getEmployee().getSurname())
            .basic(master.getBasic())
            .hra(master.getHra())
            .fixedPersonalAllowance(master.getFixedPersonalAllowance())
            .otherAllowance(master.getOtherAllowance())
            .bonus(master.getBonus())
            .appraisalAmount(master.getAppraisalAmount())
            .lateSittingAmount(master.getLateSittingAmount())
            .pfDeduction(master.getPfDeduction())
            .esiDeduction(master.getEsiDeduction())
            .ptDeduction(master.getPtDeduction())
            .overtimeWages(master.getOvertimeWages())
            .workingHoursPerDay(master.getWorkingHoursPerDay())
            .weeklyOff(master.getWeeklyOff())
            .workerType(master.getWorkerType())
            .effectiveFrom(master.getEffectiveFrom())
            .updatedAt(master.getUpdatedAt())
            .updatedBy(master.getUpdatedBy())
            .build();
    }

    private BigDecimal safe(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    private String getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }
}
