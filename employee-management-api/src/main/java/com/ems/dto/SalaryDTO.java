package com.ems.dto;

import com.ems.model.Salary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryDTO {

    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String designation;
    private String gender;
    private String workerType;
    private Integer wageMonth;
    private Integer wageYear;
    private BigDecimal basic;
    private BigDecimal hra;
    private BigDecimal fixedPersonalAllowance;
    private BigDecimal otherAllowance;
    private BigDecimal bonus;
    private BigDecimal appraisalAmount;
    private BigDecimal lateSittingAmount;
    private BigDecimal grossSalary;
    private BigDecimal pfDeduction;
    private BigDecimal esiDeduction;
    private BigDecimal ptDeduction;
    private BigDecimal overtimeWages;
    private BigDecimal netPay;
    private Integer workingHoursPerDay;
    private String weeklyOff;
    private LocalDateTime dateOfPayment;
    private LocalDateTime createdAt;

    public static SalaryDTO fromEntity(Salary salary) {
        return SalaryDTO.builder()
            .id(salary.getId())
            .employeeId(salary.getEmployee().getId())
            .employeeCode(salary.getEmployee().getEmployeeCode())
            .employeeName(salary.getEmployee().getFullName())
            .designation(salary.getEmployee().getDesignation())
            .gender(salary.getEmployee().getGender())
            .workerType(salary.getWorkerType())
            .wageMonth(salary.getWageMonth())
            .wageYear(salary.getWageYear())
            .basic(salary.getBasic())
            .hra(salary.getHra())
            .fixedPersonalAllowance(salary.getFixedPersonalAllowance())
            .otherAllowance(salary.getOtherAllowance())
            .bonus(salary.getBonus())
            .appraisalAmount(salary.getAppraisalAmount())
            .lateSittingAmount(salary.getLateSittingAmount())
            .grossSalary(salary.getGrossSalary())
            .pfDeduction(salary.getPfDeduction())
            .esiDeduction(salary.getEsiDeduction())
            .ptDeduction(salary.getPtDeduction())
            .overtimeWages(salary.getOvertimeWages())
            .netPay(salary.getNetPay())
            .workingHoursPerDay(salary.getWorkingHoursPerDay())
            .weeklyOff(salary.getWeeklyOff())
            .dateOfPayment(salary.getDateOfPayment())
            .createdAt(salary.getCreatedAt())
            .build();
    }
}
