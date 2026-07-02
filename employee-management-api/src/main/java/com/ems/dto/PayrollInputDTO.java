package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollInputDTO {

    private List<PayrollInputItem> inputs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PayrollInputItem {
        private Long employeeId;
        private Integer wageMonth;
        private Integer wageYear;
        private BigDecimal basic;
        private BigDecimal hra;
        private BigDecimal fixedPersonalAllowance;
        private BigDecimal otherAllowance;
        private BigDecimal bonus;
        private BigDecimal appraisalAmount;
        private BigDecimal lateSittingAmount;
        private BigDecimal pfDeduction;
        private BigDecimal esiDeduction;
        private BigDecimal ptDeduction;
        private BigDecimal overtimeWages;
        private Integer workingHoursPerDay;
        private String weeklyOff;
        private String workerType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchResult {
        private int successCount;
        private int failureCount;
        private List<String> errors;
    }
}
