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
    private String fromDate;
    private String toDate;
    private int totalEmployees;
    private int page;
    private int size;
    private List<DayColumnDTO> dayColumns;
    private List<SummaryRowDTO> summaryRows;
    private List<EmployeeAttendanceDTO> employees;
}
