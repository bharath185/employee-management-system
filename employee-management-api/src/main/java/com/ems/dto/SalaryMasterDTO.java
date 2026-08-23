package com.ems.dto;

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
public class SalaryMasterDTO {
    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String designation;
    private String department;
    private BigDecimal basic;
    private BigDecimal hra;
    private BigDecimal fixedPersonalAllowance;
    private BigDecimal otherAllowance;
    private BigDecimal grossSalary;
    private BigDecimal bonus;
    private BigDecimal appraisalAmount;
    private BigDecimal lateSittingAmount;
    private BigDecimal pfDeduction;
    private BigDecimal esiDeduction;
    private BigDecimal ptDeduction;
    private BigDecimal healthInsurance;
    private BigDecimal totalDeductions;
    private BigDecimal netPay;
    private BigDecimal annualCtc;
    private BigDecimal overtimeWages;
    private Integer workingHoursPerDay;
    private String weeklyOff;
    private String workerType;
    private LocalDateTime effectiveFrom;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
