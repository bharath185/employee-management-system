package com.ems.dto;

import com.ems.model.FormFieldConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormFieldConfigDTO {
    private Long id;
    private String fieldKey;
    private String fieldLabel;
    private String tabName;
    private String fieldType;
    private String masterCategory;
    private String options;
    private Boolean isMandatory;
    private Boolean isVisible;
    private Boolean isCustom;
    private Integer sortOrder;
    private String placeholder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FormFieldConfigDTO fromEntity(FormFieldConfig entity) {
        if (entity == null) return null;
        return FormFieldConfigDTO.builder()
                .id(entity.getId())
                .fieldKey(entity.getFieldKey())
                .fieldLabel(entity.getFieldLabel())
                .tabName(entity.getTabName())
                .fieldType(entity.getFieldType())
                .masterCategory(entity.getMasterCategory())
                .options(entity.getOptions())
                .isMandatory(entity.getIsMandatory() != null ? entity.getIsMandatory() : false)
                .isVisible(entity.getIsVisible() != null ? entity.getIsVisible() : true)
                .isCustom(entity.getIsCustom() != null ? entity.getIsCustom() : false)
                .sortOrder(entity.getSortOrder() != null ? entity.getSortOrder() : 0)
                .placeholder(entity.getPlaceholder())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public FormFieldConfig toEntity() {
        return FormFieldConfig.builder()
                .id(this.id)
                .fieldKey(this.fieldKey)
                .fieldLabel(this.fieldLabel)
                .tabName(this.tabName)
                .fieldType(this.fieldType != null ? this.fieldType : "TEXT")
                .masterCategory(this.masterCategory)
                .options(this.options)
                .isMandatory(this.isMandatory != null ? this.isMandatory : false)
                .isVisible(this.isVisible != null ? this.isVisible : true)
                .isCustom(this.isCustom != null ? this.isCustom : false)
                .sortOrder(this.sortOrder != null ? this.sortOrder : 0)
                .placeholder(this.placeholder)
                .build();
    }
}
