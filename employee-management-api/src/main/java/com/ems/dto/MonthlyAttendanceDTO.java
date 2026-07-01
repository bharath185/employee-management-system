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
public class MonthlyAttendanceDTO {
    private int year;
    private int month;
    private int daysInMonth;
    private List<EmployeeAttendanceDTO> employees;
}
