package com.ems.dto;

import com.ems.model.PayrollProcess;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollProcessDTO {

    private Long id;
    private Integer processYear;
    private Integer processMonth;
    private Integer totalEmployees;
    private Integer processedCount;
    private String status;
    private String errorMessage;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;

    public static PayrollProcessDTO fromEntity(PayrollProcess process) {
        return PayrollProcessDTO.builder()
            .id(process.getId())
            .processYear(process.getProcessYear())
            .processMonth(process.getProcessMonth())
            .totalEmployees(process.getTotalEmployees())
            .processedCount(process.getProcessedCount())
            .status(process.getStatus())
            .errorMessage(process.getErrorMessage())
            .startedAt(process.getStartedAt())
            .completedAt(process.getCompletedAt())
            .createdAt(process.getCreatedAt())
            .build();
    }
}
