package com.ems.dto;

import com.ems.model.ReportTemplate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportTemplateDTO {
    private Long id;
    private String name;
    private String description;
    private String category;
    private String filtersJson;
    private String columnsJson;
    private String sortBy;
    private String sortDirection;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReportTemplateDTO fromEntity(ReportTemplate entity) {
        if (entity == null) return null;
        return ReportTemplateDTO.builder()
            .id(entity.getId())
            .name(entity.getName())
            .description(entity.getDescription())
            .category(entity.getCategory())
            .filtersJson(entity.getFiltersJson())
            .columnsJson(entity.getColumnsJson())
            .sortBy(entity.getSortBy())
            .sortDirection(entity.getSortDirection())
            .createdBy(entity.getCreatedBy())
            .createdAt(entity.getCreatedAt())
            .updatedAt(entity.getUpdatedAt())
            .build();
    }
}
