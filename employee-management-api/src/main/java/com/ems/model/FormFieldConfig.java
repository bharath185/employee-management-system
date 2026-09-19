package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "form_field_configs", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"field_key"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormFieldConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "field_key", nullable = false, length = 64)
    private String fieldKey;

    @Column(name = "field_label", nullable = false, length = 128)
    private String fieldLabel;

    @Column(name = "tab_name", nullable = false, length = 64)
    private String tabName;

    @Column(name = "field_type", nullable = false, length = 32)
    @Builder.Default
    private String fieldType = "TEXT"; // TEXT, NUMBER, DATE, SELECT, BOOLEAN, TEXTAREA

    @Column(name = "master_category", length = 64)
    private String masterCategory;

    @Column(name = "options", length = 500)
    private String options;

    @Column(name = "is_mandatory")
    @Builder.Default
    private Boolean isMandatory = false;

    @Column(name = "is_visible")
    @Builder.Default
    private Boolean isVisible = true;

    @Column(name = "is_custom")
    @Builder.Default
    private Boolean isCustom = false;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "placeholder", length = 128)
    private String placeholder;

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
