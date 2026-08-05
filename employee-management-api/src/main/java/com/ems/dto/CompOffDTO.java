package com.ems.dto;

import com.ems.model.CompOff;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompOffDTO {

    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private LocalDate earnedDate;
    private String status;
    private LocalDate availedDate;
    private String remarks;
    private LocalDateTime createdAt;

    public static CompOffDTO fromEntity(CompOff co) {
        return CompOffDTO.builder()
            .id(co.getId())
            .employeeId(co.getEmployee().getId())
            .employeeCode(co.getEmployee().getEmployeeCode())
            .employeeName(co.getEmployee().getFullName())
            .earnedDate(co.getEarnedDate())
            .status(co.getStatus())
            .availedDate(co.getAvailedDate())
            .remarks(co.getRemarks())
            .createdAt(co.getCreatedAt())
            .build();
    }
}
