package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log", indexes = {
    @Index(name = "idx_audit_employee_id", columnList = "employee_id"),
    @Index(name = "idx_audit_changed_at", columnList = "changed_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id")
    private Long employeeId;

    @Column(name = "field_name", length = 50)
    private String fieldName;

    @Column(name = "old_value", length = 500)
    private String oldValue;

    @Column(name = "new_value", length = 500)
    private String newValue;

    @Column(name = "changed_by", length = 20)
    private String changedBy;

    @Column(name = "changed_by_role", length = 20)
    private String changedByRole;

    @Column(name = "change_type", length = 20)
    private String changeType;

    @Column(name = "changed_at")
    @Builder.Default
    private LocalDateTime changedAt = LocalDateTime.now();
}
