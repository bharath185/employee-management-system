package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "salaries", indexes = {
    @Index(name = "idx_salary_employee", columnList = "employee_id"),
    @Index(name = "idx_salary_period", columnList = "wage_year, wage_month")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Salary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "wage_month", nullable = false)
    private Integer wageMonth;

    @Column(name = "wage_year", nullable = false)
    private Integer wageYear;

    @Column(name = "basic", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal basic = BigDecimal.ZERO;

    @Column(name = "hra", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal hra = BigDecimal.ZERO;

    @Column(name = "fixed_personal_allowance", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal fixedPersonalAllowance = BigDecimal.ZERO;

    @Column(name = "other_allowance", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal otherAllowance = BigDecimal.ZERO;

    @Column(name = "bonus", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal bonus = BigDecimal.ZERO;

    @Column(name = "appraisal_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal appraisalAmount = BigDecimal.ZERO;

    @Column(name = "late_sitting_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal lateSittingAmount = BigDecimal.ZERO;

    @Column(name = "gross_salary", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal grossSalary = BigDecimal.ZERO;

    @Column(name = "pf_deduction", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal pfDeduction = BigDecimal.ZERO;

    @Column(name = "esi_deduction", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal esiDeduction = BigDecimal.ZERO;

    @Column(name = "pt_deduction", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal ptDeduction = BigDecimal.ZERO;

    @Column(name = "overtime_wages", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal overtimeWages = BigDecimal.ZERO;

    @Column(name = "net_pay", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal netPay = BigDecimal.ZERO;

    @Column(name = "working_hours_per_day")
    @Builder.Default
    private Integer workingHoursPerDay = 8;

    @Column(name = "weekly_off", length = 20)
    @Builder.Default
    private String weeklyOff = "Allowed";

    @Column(name = "worker_type", length = 20)
    @Builder.Default
    private String workerType = "Permanent";

    @Column(name = "date_of_payment")
    private LocalDateTime dateOfPayment;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", length = 50, updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    @PrePersist
    @PreUpdate
    public void computeDerivedFields() {
        this.grossSalary = BigDecimal.ZERO
            .add(safe(basic))
            .add(safe(hra))
            .add(safe(fixedPersonalAllowance))
            .add(safe(otherAllowance))
            .add(safe(bonus))
            .add(safe(appraisalAmount))
            .add(safe(lateSittingAmount));

        this.netPay = grossSalary
            .subtract(safe(pfDeduction))
            .subtract(safe(esiDeduction))
            .subtract(safe(ptDeduction))
            .add(safe(overtimeWages));
    }

    private BigDecimal safe(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }
}
