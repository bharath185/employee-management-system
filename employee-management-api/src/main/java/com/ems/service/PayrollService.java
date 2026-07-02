package com.ems.service;

import com.ems.dto.PayrollProcessDTO;
import com.ems.exception.BadRequestException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.*;
import com.ems.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayrollService {

    private final PayslipRepository payslipRepository;
    private final PayrollProcessRepository payrollProcessRepository;
    private final SalaryRepository salaryRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final SalaryMasterRepository salaryMasterRepository;

    /**
     * Process payroll for a given month/year.
     * Attendance cycle: 26th of previous month to 25th of current month.
     */
    @Transactional
    public PayrollProcessDTO processPayroll(Integer year, Integer month) {
        // Check if already completed for this period
        var existingOpt = payrollProcessRepository.findByProcessYearAndProcessMonth(year, month);
        if (existingOpt.isPresent() && "COMPLETED".equals(existingOpt.get().getStatus())) {
            throw new BadRequestException("Payroll already processed for " + month + "/" + year);
        }

        // Create payroll process record
        PayrollProcess process = PayrollProcess.builder()
            .processYear(year)
            .processMonth(month)
            .status("PROCESSING")
            .startedAt(LocalDateTime.now())
            .build();
        process = payrollProcessRepository.save(process);

        List<Employee> employees = employeeRepository.findAllLiveEmployees();
        int total = employees.size();
        int processed = 0;
        List<String> errors = new ArrayList<>();

        // Calculate attendance period: 26th of prev month to 25th of current month
        LocalDate cycleStart, cycleEnd;
        if (month == 1) {
            cycleStart = LocalDate.of(year - 1, 12, 26);
            cycleEnd = LocalDate.of(year, 1, 25);
        } else {
            cycleStart = LocalDate.of(year, month - 1, 26);
            cycleEnd = LocalDate.of(year, month, 25);
        }

        for (Employee emp : employees) {
            try {
                // Find or create Salary record for this period (fallback to SalaryMaster)
                Salary salary = salaryRepository
                    .findByEmployeeIdAndWageYearAndWageMonth(emp.getId(), year, month)
                    .orElseGet(() -> {
                        Salary newSal = Salary.builder()
                            .employee(emp)
                            .wageMonth(month)
                            .wageYear(year)
                            .build();
                        // Copy from SalaryMaster if available
                        salaryMasterRepository.findByEmployeeId(emp.getId()).ifPresent(master -> {
                            newSal.setBasic(master.getBasic());
                            newSal.setHra(master.getHra());
                            newSal.setFixedPersonalAllowance(master.getFixedPersonalAllowance());
                            newSal.setOtherAllowance(master.getOtherAllowance());
                            newSal.setBonus(master.getBonus());
                            newSal.setAppraisalAmount(master.getAppraisalAmount());
                            newSal.setLateSittingAmount(master.getLateSittingAmount());
                            newSal.setPfDeduction(master.getPfDeduction());
                            newSal.setEsiDeduction(master.getEsiDeduction());
                            newSal.setPtDeduction(master.getPtDeduction());
                            newSal.setOvertimeWages(master.getOvertimeWages());
                            newSal.setWorkingHoursPerDay(master.getWorkingHoursPerDay());
                            newSal.setWeeklyOff(master.getWeeklyOff());
                            newSal.setWorkerType(master.getWorkerType());
                        });
                        newSal.computeDerivedFields();
                        return salaryRepository.save(newSal);
                    });

                // Get attendance for the cycle
                List<AttendanceRecord> attendance = attendanceRepository
                    .findByEmployeeIdAndAttendanceDateBetween(emp.getId(), cycleStart, cycleEnd);

                int presentDays = (int) attendance.stream().filter(a -> "P".equals(a.getStatus())).count();
                int absentDays = (int) attendance.stream().filter(a -> "A".equals(a.getStatus())).count();
                int leaveDays = (int) attendance.stream().filter(a ->
                    "L".equals(a.getStatus()) || "ML".equals(a.getStatus())).count();
                int totalWorkingDays = attendance.size();

                // Compute total deductions
                BigDecimal totalDeductions = safe(salary.getPfDeduction())
                    .add(safe(salary.getEsiDeduction()))
                    .add(safe(salary.getPtDeduction()));

                // Create payslip snapshot
                Payslip payslip = Payslip.builder()
                    .employee(emp)
                    .wageMonth(month)
                    .wageYear(year)
                    .basic(safe(salary.getBasic()))
                    .hra(safe(salary.getHra()))
                    .fixedPersonalAllowance(safe(salary.getFixedPersonalAllowance()))
                    .otherAllowance(safe(salary.getOtherAllowance()))
                    .bonus(safe(salary.getBonus()))
                    .appraisalAmount(safe(salary.getAppraisalAmount()))
                    .lateSittingAmount(safe(salary.getLateSittingAmount()))
                    .grossSalary(safe(salary.getGrossSalary()))
                    .pfDeduction(safe(salary.getPfDeduction()))
                    .esiDeduction(safe(salary.getEsiDeduction()))
                    .ptDeduction(safe(salary.getPtDeduction()))
                    .overtimeWages(safe(salary.getOvertimeWages()))
                    .totalDeductions(totalDeductions)
                    .netPay(safe(salary.getNetPay()))
                    .presentDays(presentDays)
                    .absentDays(absentDays)
                    .leaveDays(leaveDays)
                    .totalWorkingDays(totalWorkingDays)
                    .status("GENERATED")
                    .generatedAt(LocalDateTime.now())
                    .build();

                payslipRepository.save(payslip);
                processed++;
            } catch (Exception e) {
                log.error("Error processing payroll for employee {}: {}", emp.getEmployeeCode(), e.getMessage());
                errors.add(emp.getEmployeeCode() + ": " + e.getMessage());
            }
        }

        // Update process record
        process.setStatus("COMPLETED");
        process.setTotalEmployees(total);
        process.setProcessedCount(processed);
        if (!errors.isEmpty()) {
            process.setErrorMessage(String.join("; ", errors));
        }
        process.setCompletedAt(LocalDateTime.now());
        payrollProcessRepository.save(process);

        log.info("Payroll processed for {}/{}: {}/{} employees", month, year, processed, total);
        return PayrollProcessDTO.fromEntity(process);
    }

    public PayrollProcessDTO getPayrollStatus(Integer year, Integer month) {
        PayrollProcess process = payrollProcessRepository.findByProcessYearAndProcessMonth(year, month)
            .orElseThrow(() -> new ResourceNotFoundException("No payroll process found for " + month + "/" + year));
        return PayrollProcessDTO.fromEntity(process);
    }

    public List<PayrollProcessDTO> getPayrollHistory(Integer year, Integer month) {
        List<PayrollProcess> processes;
        if (year != null && month != null) {
            processes = payrollProcessRepository.findByProcessYearAndProcessMonthOrderByCreatedAtDesc(year, month);
        } else if (year != null) {
            processes = payrollProcessRepository.findByProcessYearOrderByProcessMonthDesc(year);
        } else {
            processes = payrollProcessRepository.findAll();
        }
        return processes.stream()
            .map(PayrollProcessDTO::fromEntity)
            .collect(Collectors.toList());
    }

    /**
     * Batch upsert payroll inputs (salary adjustments) for HR.
     */
    @Transactional(noRollbackFor = Exception.class)
    public Map<String, Object> batchUpsertPayrollInputs(List<com.ems.dto.PayrollInputDTO.PayrollInputItem> inputs) {
        int success = 0;
        int failure = 0;
        List<String> errors = new ArrayList<>();

        for (var item : inputs) {
            try {
                Employee employee = employeeRepository.findById(item.getEmployeeId()).orElse(null);
                if (employee == null) {
                    failure++;
                    errors.add("Employee " + item.getEmployeeId() + ": not found");
                    continue;
                }

                Salary salary = salaryRepository
                    .findByEmployeeIdAndWageYearAndWageMonth(
                        item.getEmployeeId(), item.getWageYear(), item.getWageMonth())
                    .orElseGet(() -> Salary.builder()
                        .employee(employee)
                        .wageMonth(item.getWageMonth())
                        .wageYear(item.getWageYear())
                        .build());

                if (item.getBasic() != null) salary.setBasic(item.getBasic());
                if (item.getHra() != null) salary.setHra(item.getHra());
                if (item.getFixedPersonalAllowance() != null) salary.setFixedPersonalAllowance(item.getFixedPersonalAllowance());
                if (item.getOtherAllowance() != null) salary.setOtherAllowance(item.getOtherAllowance());
                if (item.getBonus() != null) salary.setBonus(item.getBonus());
                if (item.getAppraisalAmount() != null) salary.setAppraisalAmount(item.getAppraisalAmount());
                if (item.getLateSittingAmount() != null) salary.setLateSittingAmount(item.getLateSittingAmount());
                if (item.getPfDeduction() != null) salary.setPfDeduction(item.getPfDeduction());
                if (item.getEsiDeduction() != null) salary.setEsiDeduction(item.getEsiDeduction());
                if (item.getPtDeduction() != null) salary.setPtDeduction(item.getPtDeduction());
                if (item.getOvertimeWages() != null) salary.setOvertimeWages(item.getOvertimeWages());
                if (item.getWorkingHoursPerDay() != null) salary.setWorkingHoursPerDay(item.getWorkingHoursPerDay());
                if (item.getWeeklyOff() != null) salary.setWeeklyOff(item.getWeeklyOff());
                if (item.getWorkerType() != null) salary.setWorkerType(item.getWorkerType());

                salary.computeDerivedFields();
                salaryRepository.save(salary);
                success++;
            } catch (Exception e) {
                log.error("Error upserting payroll input for employee {}: {}", item.getEmployeeId(), e.getMessage());
                failure++;
                errors.add("Employee " + item.getEmployeeId() + ": " + e.getMessage());
            }
        }

        log.info("Batch upsert payroll inputs: {} success, {} failure", success, failure);
        return Map.of(
            "successCount", success,
            "failureCount", failure,
            "errors", errors
        );
    }

    public void deleteProcessRecord(Integer year, Integer month) {
        payrollProcessRepository.findByProcessYearAndProcessMonth(year, month)
            .ifPresent(p -> { payrollProcessRepository.delete(p); log.info("Deleted process record for {}/{}", month, year); });
    }

    private BigDecimal safe(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }
}
