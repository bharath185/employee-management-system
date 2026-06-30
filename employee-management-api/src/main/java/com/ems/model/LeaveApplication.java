package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_applications", indexes = {
    @Index(name = "idx_leave_app_employee", columnList = "employee_id"),
    @Index(name = "idx_leave_app_status", columnList = "status"),
    @Index(name = "idx_leave_app_dates", columnList = "from_date, to_date")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_type_id", nullable = false)
    private LeaveType leaveType;

    @Column(name = "from_date", nullable = false)
    private LocalDate fromDate;

    @Column(name = "to_date", nullable = false)
    private LocalDate toDate;

    @Column(name = "days", nullable = false)
    private Integer days;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "applied_date", nullable = false)
    @Builder.Default
    private LocalDateTime appliedDate = LocalDateTime.now();

    @Column(name = "approved_by", length = 50)
    private String approvedBy;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
