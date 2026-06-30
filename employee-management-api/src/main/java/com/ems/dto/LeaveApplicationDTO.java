package com.ems.dto;

import com.ems.model.LeaveApplication;
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
public class LeaveApplicationDTO {

    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private Long leaveTypeId;
    private String leaveTypeName;
    private LocalDate fromDate;
    private LocalDate toDate;
    private Integer days;
    private String reason;
    private String status;
    private LocalDateTime appliedDate;
    private String approvedBy;
    private LocalDateTime approvedDate;

    public static LeaveApplicationDTO fromEntity(LeaveApplication la) {
        return LeaveApplicationDTO.builder()
            .id(la.getId())
            .employeeId(la.getEmployee().getId())
            .employeeCode(la.getEmployee().getEmployeeCode())
            .employeeName(la.getEmployee().getFullName())
            .leaveTypeId(la.getLeaveType().getId())
            .leaveTypeName(la.getLeaveType().getName())
            .fromDate(la.getFromDate())
            .toDate(la.getToDate())
            .days(la.getDays())
            .reason(la.getReason())
            .status(la.getStatus())
            .appliedDate(la.getAppliedDate())
            .approvedBy(la.getApprovedBy())
            .approvedDate(la.getApprovedDate())
            .build();
    }
}
