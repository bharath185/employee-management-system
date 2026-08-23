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
@Table(name = "salary_master", uniqueConstraints = {
    @UniqueConstraint(name = "uk_salary_master_employee", columnNames = "employee_id")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private Employee employee;

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

    @Column(name = "pf_deduction", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal pfDeduction = BigDecimal.ZERO;

    @Column(name = "esi_deduction", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal esiDeduction = BigDecimal.ZERO;

    @Column(name = "pt_deduction", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal ptDeduction = BigDecimal.ZERO;

    @Column(name = "health_insurance", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal healthInsurance = BigDecimal.ZERO;

    @Column(name = "overtime_wages", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal overtimeWages = BigDecimal.ZERO;

    @Column(name = "working_hours_per_day")
    @Builder.Default
    private Integer workingHoursPerDay = 8;

    @Column(name = "weekly_off", length = 20)
    @Builder.Default
    private String weeklyOff = "Allowed";

    @Column(name = "worker_type", length = 20)
    @Builder.Default
    private String workerType = "Permanent";

    @Column(name = "effective_from")
    private LocalDateTime effectiveFrom;

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

    public BigDecimal getGrossSalary() {
        BigDecimal sum = BigDecimal.ZERO;
        if (basic != null) sum = sum.add(basic);
        if (hra != null) sum = sum.add(hra);
        if (fixedPersonalAllowance != null) sum = sum.add(fixedPersonalAllowance);
        if (otherAllowance != null) sum = sum.add(otherAllowance);
        return sum;
    }

    public BigDecimal getTotalDeductions() {
        BigDecimal sum = BigDecimal.ZERO;
        if (pfDeduction != null) sum = sum.add(pfDeduction);
        if (esiDeduction != null) sum = sum.add(esiDeduction);
        if (ptDeduction != null) sum = sum.add(ptDeduction);
        if (healthInsurance != null) sum = sum.add(healthInsurance);
        return sum;
    }

    public BigDecimal getNetPay() {
        BigDecimal gross = getGrossSalary();
        BigDecimal ded = getTotalDeductions();
        BigDecimal net = gross.subtract(ded);
        if (bonus != null) net = net.add(bonus);
        if (appraisalAmount != null) net = net.add(appraisalAmount);
        if (lateSittingAmount != null) net = net.add(lateSittingAmount);
        if (overtimeWages != null) net = net.add(overtimeWages);
        return net.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : net;
    }

    public BigDecimal getAnnualCtc() {
        BigDecimal monthlyGross = getGrossSalary();
        BigDecimal monthlyPf = pfDeduction != null ? pfDeduction : BigDecimal.ZERO;
        BigDecimal monthlyEsi = esiDeduction != null ? esiDeduction : BigDecimal.ZERO;
        return monthlyGross.add(monthlyPf).add(monthlyEsi).multiply(BigDecimal.valueOf(12));
    }
}
