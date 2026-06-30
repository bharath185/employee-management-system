package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "leave_types")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", length = 50, nullable = false, unique = true)
    private String name;

    @Column(name = "description", length = 200)
    private String description;

    @Column(name = "annual_entitlement", nullable = false)
    private Integer annualEntitlement;

    @Column(name = "is_carry_forward")
    @Builder.Default
    private Boolean isCarryForward = false;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
