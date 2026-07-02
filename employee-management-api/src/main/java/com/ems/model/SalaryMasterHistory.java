package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "salary_master_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryMasterHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "salary_master_id")
    private Long salaryMasterId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "employee_code", length = 20)
    private String employeeCode;

    @Column(name = "field_name", length = 50)
    private String fieldName;

    @Column(name = "old_value", length = 255)
    private String oldValue;

    @Column(name = "new_value", length = 255)
    private String newValue;

    @Column(name = "changed_by", length = 50)
    private String changedBy;

    @Column(name = "changed_at")
    private LocalDateTime changedAt;
}
