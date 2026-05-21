package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "master_data", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"category", "code"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MasterData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(name = "option_value", nullable = false, length = 100)
    private String value;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
