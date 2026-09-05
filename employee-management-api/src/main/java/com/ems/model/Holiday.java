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

    @Column(name = "is_process_specific")
    @Builder.Default
    private Boolean isProcessSpecific = false;

    @Column(name = "processes", length = 500)
    private String processes;

    @Column(name = "is_department_specific")
    @Builder.Default
    private Boolean isDepartmentSpecific = false;

    @Column(name = "departments", length = 500)
    private String departments;

    public boolean appliesToProcess(String process) {
        boolean specific = Boolean.TRUE.equals(this.isProcessSpecific) || Boolean.TRUE.equals(this.isDepartmentSpecific);
        String target = (this.processes != null && !this.processes.trim().isEmpty()) ? this.processes : this.departments;
        if (!specific || target == null || target.trim().isEmpty()) {
            return true;
        }
        if (process == null || process.trim().isEmpty()) {
            return false;
        }
        String[] procs = target.split(",");
        for (String p : procs) {
            if (p.trim().equalsIgnoreCase(process.trim())) {
                return true;
            }
        }
        return false;
    }

    public boolean appliesToDepartment(String department) {
        return appliesToProcess(department);
    }

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
