package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "salary_master_snapshots", indexes = {
    @Index(name = "idx_snap_employee", columnList = "employee_id"),
    @Index(name = "idx_snap_year_month", columnList = "snapshot_year, snapshot_month")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryMasterSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "employee_code", length = 20)
    private String employeeCode;

    @Column(name = "snapshot_year", nullable = false)
    private Integer snapshotYear;

    @Column(name = "snapshot_month", nullable = false)
    private Integer snapshotMonth;

    @Column(name = "basic", precision = 12, scale = 2)
    private BigDecimal basic;

    @Column(name = "hra", precision = 12, scale = 2)
    private BigDecimal hra;

    @Column(name = "fixed_personal_allowance", precision = 12, scale = 2)
    private BigDecimal fixedPersonalAllowance;

    @Column(name = "other_allowance", precision = 12, scale = 2)
    private BigDecimal otherAllowance;

    @Column(name = "bonus", precision = 12, scale = 2)
    private BigDecimal bonus;

    @Column(name = "appraisal_amount", precision = 12, scale = 2)
    private BigDecimal appraisalAmount;

    @Column(name = "late_sitting_amount", precision = 12, scale = 2)
    private BigDecimal lateSittingAmount;

    @Column(name = "pf_deduction", precision = 12, scale = 2)
    private BigDecimal pfDeduction;

    @Column(name = "esi_deduction", precision = 12, scale = 2)
    private BigDecimal esiDeduction;

    @Column(name = "pt_deduction", precision = 12, scale = 2)
    private BigDecimal ptDeduction;

    @Column(name = "overtime_wages", precision = 12, scale = 2)
    private BigDecimal overtimeWages;

    @Column(name = "working_hours_per_day")
    private Integer workingHoursPerDay;

    @Column(name = "worker_type", length = 20)
    private String workerType;

    @Column(name = "changed_by", length = 50)
    private String changedBy;

    @Column(name = "remarks", length = 255)
    private String remarks;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
