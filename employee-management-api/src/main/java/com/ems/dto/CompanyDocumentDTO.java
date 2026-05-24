package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyDocumentDTO {

    private Long id;
    private Long companyId;
    private String documentType;
    private String fileName;
    private String originalName;
    private Long fileSize;
    private String contentType;
    private LocalDateTime uploadedAt;
    private String uploadedBy;
}
