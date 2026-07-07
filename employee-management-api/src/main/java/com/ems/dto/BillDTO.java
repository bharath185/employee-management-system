package com.ems.dto;

import com.ems.model.Bill;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillDTO {
    private Long id;
    private String vendorName;
    private String billType;
    private BigDecimal amount;
    private LocalDate billDate;
    private LocalDate dueDate;
    private int month;
    private int year;

    @JsonProperty("isProcessed")
    private boolean isProcessed;

    private String description;
    private String fileName;
    private Long fileSize;
    private String contentType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;

    public static BillDTO fromEntity(Bill bill) {
        return BillDTO.builder()
            .id(bill.getId())
            .vendorName(bill.getVendorName())
            .billType(bill.getBillType())
            .amount(bill.getAmount())
            .billDate(bill.getBillDate())
            .dueDate(bill.getDueDate())
            .month(bill.getMonth())
            .year(bill.getYear())
            .isProcessed("PROCESSED".equals(bill.getStatus()))
            .description(bill.getDescription())
            .fileName(bill.getFileName())
            .fileSize(bill.getFileSize())
            .contentType(bill.getContentType())
            .createdAt(bill.getCreatedAt())
            .updatedAt(bill.getUpdatedAt())
            .createdBy(bill.getCreatedBy())
            .updatedBy(bill.getUpdatedBy())
            .build();
    }
}
