package com.ems.dto;

import com.ems.model.DocumentTemplate;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentTemplateDTO {

    private Long id;
    private String templateName;
    private String templateType;
    private String description;
    private String content;
    private String variables;
    @JsonProperty("active")
    private Boolean isActive;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    private String createdBy;
    private String updatedBy;

    public static DocumentTemplateDTO fromEntity(DocumentTemplate template) {
        if (template == null) return null;
        return DocumentTemplateDTO.builder()
            .id(template.getId())
            .templateName(template.getTemplateName())
            .templateType(template.getTemplateType())
            .description(template.getDescription())
            .content(template.getContent())
            .variables(template.getVariables())
            .isActive(template.getIsActive())
            .createdAt(template.getCreatedAt())
            .updatedAt(template.getUpdatedAt())
            .createdBy(template.getCreatedBy())
            .updatedBy(template.getUpdatedBy())
            .build();
    }

    public DocumentTemplate toEntity() {
        DocumentTemplate template = new DocumentTemplate();
        template.setTemplateName(this.templateName);
        template.setTemplateType(this.templateType);
        template.setDescription(this.description);
        template.setContent(this.content);
        template.setVariables(this.variables);
        template.setIsActive(this.isActive);
        return template;
    }
}
