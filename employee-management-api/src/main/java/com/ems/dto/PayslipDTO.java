package com.ems.dto;

import com.ems.model.Payslip;
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
public class PayslipDTO {

    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String designation;
    private String gender;
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
    private BigDecimal healthInsurance;
    private BigDecimal overtimeWages;
    private BigDecimal totalDeductions;
    private BigDecimal netPay;
    private Integer presentDays;
    private Integer absentDays;
    private Integer leaveDays;
    private Integer totalWorkingDays;
    private Integer lopDays;
    private Integer effectiveWorkdays;
    private String status;
    private LocalDateTime generatedAt;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;

    public static PayslipDTO fromEntity(Payslip payslip) {
        return PayslipDTO.builder()
            .id(payslip.getId())
            .employeeId(payslip.getEmployee().getId())
            .employeeCode(payslip.getEmployee().getEmployeeCode())
            .employeeName(payslip.getEmployee().getFullName())
            .designation(payslip.getEmployee().getDesignation())
            .gender(payslip.getEmployee().getGender())
            .wageMonth(payslip.getWageMonth())
            .wageYear(payslip.getWageYear())
            .basic(payslip.getBasic())
            .hra(payslip.getHra())
            .fixedPersonalAllowance(payslip.getFixedPersonalAllowance())
            .otherAllowance(payslip.getOtherAllowance())
            .bonus(payslip.getBonus())
            .appraisalAmount(payslip.getAppraisalAmount())
            .lateSittingAmount(payslip.getLateSittingAmount())
            .grossSalary(payslip.getGrossSalary())
            .pfDeduction(payslip.getPfDeduction())
            .esiDeduction(payslip.getEsiDeduction())
            .ptDeduction(payslip.getPtDeduction())
            .healthInsurance(payslip.getHealthInsurance())
            .overtimeWages(payslip.getOvertimeWages())
            .totalDeductions(payslip.getTotalDeductions())
            .netPay(payslip.getNetPay())
            .presentDays(payslip.getPresentDays())
            .absentDays(payslip.getAbsentDays())
            .leaveDays(payslip.getLeaveDays())
            .totalWorkingDays(payslip.getTotalWorkingDays())
            .lopDays(payslip.getLopDays())
            .effectiveWorkdays(payslip.getEffectiveWorkdays())
            .status(payslip.getStatus())
            .generatedAt(payslip.getGeneratedAt())
            .sentAt(payslip.getSentAt())
            .createdAt(payslip.getCreatedAt())
            .build();
    }
}
