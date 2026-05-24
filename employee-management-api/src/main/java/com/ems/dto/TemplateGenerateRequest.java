package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateGenerateRequest {

    private Long templateId;
    private Long employeeId;
}
