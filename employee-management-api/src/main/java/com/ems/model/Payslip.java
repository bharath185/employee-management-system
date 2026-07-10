package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payslips", indexes = {
    @Index(name = "idx_payslip_employee", columnList = "employee_id"),
    @Index(name = "idx_payslip_period", columnList = "wage_year, wage_month")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payslip {

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

    // Snapshot of all salary components at time of generation
    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal basic = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal hra = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal fixedPersonalAllowance = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal otherAllowance = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal bonus = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal appraisalAmount = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal lateSittingAmount = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal grossSalary = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal pfDeduction = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal esiDeduction = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal ptDeduction = BigDecimal.ZERO;

    @Column(name = "health_insurance", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal healthInsurance = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal overtimeWages = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal netPay = BigDecimal.ZERO;

    @Column(name = "present_days")
    private Integer presentDays;

    @Column(name = "absent_days")
    private Integer absentDays;

    @Column(name = "leave_days")
    private Integer leaveDays;

    @Column(name = "total_working_days")
    private Integer totalWorkingDays;

    @Column(name = "lop_days")
    private Integer lopDays;

    @Column(name = "effective_workdays")
    private Integer effectiveWorkdays;

    @Column(length = 20)
    @Builder.Default
    private String status = "GENERATED"; // GENERATED, SENT, DOWNLOADED

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
