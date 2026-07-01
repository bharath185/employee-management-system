package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeAttendanceDTO {
    private int serialNo;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String gender;
    private String department;
    private String designation;
    private String doj;
    private long vintage;
    private List<String> days;
    private int totalPresent;
    private int totalLeave;
    private int totalML;
    private int totalResign;
}
