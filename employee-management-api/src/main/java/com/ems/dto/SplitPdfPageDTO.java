package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SplitPdfPageDTO {
    private int pageNumber;
    private int totalPages;
    private String fileName;
    private Long fileSize;
    private String base64Data;
}
