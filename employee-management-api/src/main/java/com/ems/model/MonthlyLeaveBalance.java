package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "monthly_leave_balances", indexes = {
    @Index(name = "idx_mlb_employee", columnList = "employee_id"),
    @Index(name = "idx_mlb_year_month", columnList = "`year`, `month`")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "`year`", "`month`"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyLeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "`year`", nullable = false)
    private Integer year;

    @Column(name = "`month`", nullable = false)
    private Integer month;

    @Column(name = "cl_opening")
    @Builder.Default
    private Double clOpening = 0.0;

    @Column(name = "pl_opening")
    @Builder.Default
    private Double plOpening = 0.0;

    @Column(name = "cl_added")
    @Builder.Default
    private Double clAdded = 1.0;

    @Column(name = "pl_added")
    @Builder.Default
    private Double plAdded = 1.5;

    @Column(name = "cl_after_add")
    @Builder.Default
    private Double clAfterAdd = 1.0;

    @Column(name = "pl_after_add")
    @Builder.Default
    private Double plAfterAdd = 1.5;

    @Column(name = "cl_availed")
    @Builder.Default
    private Double clAvailed = 0.0;

    @Column(name = "pl_availed")
    @Builder.Default
    private Double plAvailed = 0.0;

    @Column(name = "lop")
    @Builder.Default
    private Double lop = 0.0;

    @Column(name = "total_availed")
    @Builder.Default
    private Double totalAvailed = 0.0;

    @Column(name = "cl_closing")
    @Builder.Default
    private Double clClosing = 1.0;

    @Column(name = "pl_closing")
    @Builder.Default
    private Double plClosing = 1.5;

    @Column(name = "last_working_day", length = 30)
    private String lastWorkingDay;

    @Column(name = "remarks", length = 500)
    private String remarks;

    @PrePersist
    @PreUpdate
    public void calculateValues() {
        if (clOpening == null) clOpening = 0.0;
        if (plOpening == null) plOpening = 0.0;
        if (clAdded == null) clAdded = 0.0;
        if (plAdded == null) plAdded = 0.0;
        if (clAvailed == null) clAvailed = 0.0;
        if (plAvailed == null) plAvailed = 0.0;
        if (lop == null) lop = 0.0;

        this.clAfterAdd = this.clOpening + this.clAdded;
        this.plAfterAdd = this.plOpening + this.plAdded;
        this.totalAvailed = this.clAvailed + this.plAvailed + this.lop;
        this.clClosing = this.clAfterAdd - this.clAvailed;
        this.plClosing = this.plAfterAdd - this.plAvailed;
    }
}
