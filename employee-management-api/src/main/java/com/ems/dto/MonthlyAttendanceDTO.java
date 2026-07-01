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
    private String monthLabel;
    private int totalEmployees;
    private int page;
    private int size;
    private List<DayColumnDTO> dayColumns;
    private List<SummaryRowDTO> summaryRows;
    private List<EmployeeAttendanceDTO> employees;
}
