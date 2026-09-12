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
    private Integer encashed;
    private Integer balance;

    public static LeaveBalanceDTO fromEntity(LeaveBalance lb) {
        if (lb == null) return null;
        Long empId = null;
        String empCode = "";
        String empName = "";
        try {
            if (lb.getEmployee() != null) {
                empId = lb.getEmployee().getId();
                empCode = lb.getEmployee().getEmployeeCode();
                empName = lb.getEmployee().getFullName();
            }
        } catch (Exception ignored) {}

        Long ltId = null;
        String ltName = "";
        try {
            if (lb.getLeaveType() != null) {
                ltId = lb.getLeaveType().getId();
                ltName = lb.getLeaveType().getName();
            }
        } catch (Exception ignored) {}

        return LeaveBalanceDTO.builder()
            .id(lb.getId())
            .employeeId(empId)
            .employeeCode(empCode)
            .employeeName(empName)
            .leaveTypeId(ltId)
            .leaveTypeName(ltName)
            .year(lb.getYear())
            .entitled(lb.getEntitled() != null ? lb.getEntitled() : 0)
            .taken(lb.getTaken() != null ? lb.getTaken() : 0)
            .encashed(lb.getEncashed() != null ? lb.getEncashed() : 0)
            .balance(lb.getBalance() != null ? lb.getBalance() : 0)
            .build();
    }
}
