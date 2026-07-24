package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "leave_balances", indexes = {
    @Index(name = "idx_leave_balance_employee", columnList = "employee_id"),
    @Index(name = "idx_leave_balance_year", columnList = "year")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "leave_type_id", "year"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_type_id", nullable = false)
    private LeaveType leaveType;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "entitled", nullable = false)
    @Builder.Default
    private Integer entitled = 0;

    @Column(name = "taken", nullable = false)
    @Builder.Default
    private Integer taken = 0;

    @Column(name = "encashed", nullable = false)
    @Builder.Default
    private Integer encashed = 0;

    @Column(name = "balance", nullable = false)
    @Builder.Default
    private Integer balance = 0;

    @PrePersist
    @PreUpdate
    public void computeBalance() {
        this.balance = this.entitled - this.taken - this.encashed;
    }
}
