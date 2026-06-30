package com.ems.dto;

import com.ems.model.LeaveBalance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveBalanceDTO {

    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private Long leaveTypeId;
    private String leaveTypeName;
    private Integer year;
    private Integer entitled;
    private Integer taken;
    private Integer balance;

    public static LeaveBalanceDTO fromEntity(LeaveBalance lb) {
        return LeaveBalanceDTO.builder()
            .id(lb.getId())
            .employeeId(lb.getEmployee().getId())
            .employeeCode(lb.getEmployee().getEmployeeCode())
            .employeeName(lb.getEmployee().getFullName())
            .leaveTypeId(lb.getLeaveType().getId())
            .leaveTypeName(lb.getLeaveType().getName())
            .year(lb.getYear())
            .entitled(lb.getEntitled())
            .taken(lb.getTaken())
            .balance(lb.getBalance())
            .build();
    }
}
