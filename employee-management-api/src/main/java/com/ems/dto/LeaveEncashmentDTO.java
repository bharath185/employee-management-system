package com.ems.dto;

import com.ems.model.LeaveEncashment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveEncashmentDTO {

    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private Long leaveTypeId;
    private String leaveTypeName;
    private Integer encashedDays;
    private BigDecimal encashmentAmount;
    private Integer month;
    private Integer year;
    private String status;
    private String approvedBy;
    private LocalDateTime approvedDate;
    private String remarks;
    private LocalDateTime createdAt;

    public static LeaveEncashmentDTO fromEntity(LeaveEncashment e) {
        return LeaveEncashmentDTO.builder()
            .id(e.getId())
            .employeeId(e.getEmployee().getId())
            .employeeCode(e.getEmployee().getEmployeeCode())
            .employeeName(e.getEmployee().getFullName())
            .leaveTypeId(e.getLeaveType().getId())
            .leaveTypeName(e.getLeaveType().getName())
            .encashedDays(e.getEncashedDays())
            .encashmentAmount(e.getEncashmentAmount())
            .month(e.getMonth())
            .year(e.getYear())
            .status(e.getStatus())
            .approvedBy(e.getApprovedBy())
            .approvedDate(e.getApprovedDate())
            .remarks(e.getRemarks())
            .createdAt(e.getCreatedAt())
            .build();
    }
}
