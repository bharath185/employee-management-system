package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "holidays")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Holiday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "holiday_date", nullable = false)
    private LocalDate date;

    @Column(name = "`year`", nullable = false)
    private Integer year;

    @Column(name = "is_optional")
    @Builder.Default
    private Boolean isOptional = false;

    @Column(name = "is_department_specific")
    @Builder.Default
    private Boolean isDepartmentSpecific = false;

    @Column(name = "departments", length = 500)
    private String departments;

    public boolean appliesToDepartment(String department) {
        if (!Boolean.TRUE.equals(this.isDepartmentSpecific) || this.departments == null || this.departments.trim().isEmpty()) {
            return true;
        }
        if (department == null || department.trim().isEmpty()) {
            return false;
        }
        String[] depts = this.departments.split(",");
        for (String d : depts) {
            if (d.trim().equalsIgnoreCase(department.trim())) {
                return true;
            }
        }
        return false;
    }

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
