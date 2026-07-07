package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "employee_languages", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "language"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeLanguage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "language", length = 30, nullable = false)
    private String language;

    @Column(name = "can_read")
    private boolean canRead;

    @Column(name = "can_write")
    private boolean canWrite;

    @Column(name = "can_speak")
    private boolean canSpeak;
}
