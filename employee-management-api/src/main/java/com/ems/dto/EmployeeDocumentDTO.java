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
public class EmployeeDocumentDTO {
    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String documentType;
    private String documentTitle;
    private Integer pageNumber;
    private String fileName;
    private String originalName;
    private Long fileSize;
    private String contentType;
    private String notes;
    private LocalDateTime uploadedAt;
    private String uploadedBy;
}
