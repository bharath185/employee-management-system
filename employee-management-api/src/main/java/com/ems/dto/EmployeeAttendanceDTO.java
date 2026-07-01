package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeAttendanceDTO {
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String designation;
    private Map<Integer, String> days;
    private int totalPresent;
    private int totalAbsent;
    private int totalLeave;
    private int totalHoliday;
    private int totalWeeklyOff;
}
