package com.ems.dto;

import com.ems.model.DocumentDownloadLog;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDownloadLogDTO {

    private Long id;
    private Long employeeId;
    private Long templateId;
    private String financialYear;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime downloadedAt;

    private String downloadedBy;

    public static DocumentDownloadLogDTO fromEntity(DocumentDownloadLog log) {
        if (log == null) return null;
        return DocumentDownloadLogDTO.builder()
            .id(log.getId())
            .employeeId(log.getEmployeeId())
            .templateId(log.getTemplateId())
            .financialYear(log.getFinancialYear())
            .downloadedAt(log.getDownloadedAt())
            .downloadedBy(log.getDownloadedBy())
            .build();
    }
}
