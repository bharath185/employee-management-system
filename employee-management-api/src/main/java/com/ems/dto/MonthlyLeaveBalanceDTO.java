package com.ems.dto;

import com.ems.model.Employee;
import com.ems.model.MonthlyLeaveBalance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyLeaveBalanceDTO {

    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String gender;
    private String department;
    private String doj;
    private Long vintageMonths;

    private Integer year;
    private Integer month;

    private Double clOpening;
    private Double plOpening;
    private Double clAdded;
    private Double plAdded;
    private Double clAfterAdd;
    private Double plAfterAdd;
    private Double clAvailed;
    private Double plAvailed;
    private Double lop;
    private Double totalAvailed;
    private Double clClosing;
    private Double plClosing;
    private String lastWorkingDay;
    private String remarks;

    private java.util.List<LeaveDetailDTO> clLeaveDetails;
    private java.util.List<LeaveDetailDTO> plLeaveDetails;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaveDetailDTO {
        private Long id;
        private String leaveType;
        private String fromDate;
        private String toDate;
        private Double days;
        private String reason;
        private String status;
        private String appliedDate;
        private String approvedBy;
    }

    public static MonthlyLeaveBalanceDTO fromEntity(MonthlyLeaveBalance entity) {
        if (entity == null) return null;
        Employee emp = entity.getEmployee();

        String dept = "";
        String formattedDoj = "";
        Long vintage = 0L;
        String gender = "";
        String empCode = "";
        String empName = "";

        if (emp != null) {
            empCode = emp.getEmployeeCode() != null ? emp.getEmployeeCode() : "";
            empName = emp.getFullName() != null ? emp.getFullName() : "";
            gender = emp.getGender() != null && !emp.getGender().isEmpty() ? emp.getGender().substring(0, 1).toUpperCase() : "";
            dept = emp.getProcessAssigned() != null && !emp.getProcessAssigned().isBlank()
                    ? emp.getProcessAssigned()
                    : (emp.getDepartment() != null ? emp.getDepartment() : "");

            if (emp.getDoj() != null) {
                formattedDoj = emp.getDoj().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                LocalDate targetMonth = LocalDate.of(entity.getYear(), entity.getMonth(), 1);
                vintage = Math.max(0L, ChronoUnit.MONTHS.between(emp.getDoj().withDayOfMonth(1), targetMonth));
            }
        }

        return MonthlyLeaveBalanceDTO.builder()
            .id(entity.getId())
            .employeeId(emp != null ? emp.getId() : null)
            .employeeCode(empCode)
            .employeeName(empName)
            .gender(gender)
            .department(dept)
            .doj(formattedDoj)
            .vintageMonths(vintage)
            .year(entity.getYear())
            .month(entity.getMonth())
            .clOpening(entity.getClOpening() != null ? entity.getClOpening() : 0.0)
            .plOpening(entity.getPlOpening() != null ? entity.getPlOpening() : 0.0)
            .clAdded(entity.getClAdded() != null ? entity.getClAdded() : 1.0)
            .plAdded(entity.getPlAdded() != null ? entity.getPlAdded() : 1.5)
            .clAfterAdd(entity.getClAfterAdd() != null ? entity.getClAfterAdd() : 0.0)
            .plAfterAdd(entity.getPlAfterAdd() != null ? entity.getPlAfterAdd() : 0.0)
            .clAvailed(entity.getClAvailed() != null ? entity.getClAvailed() : 0.0)
            .plAvailed(entity.getPlAvailed() != null ? entity.getPlAvailed() : 0.0)
            .lop(entity.getLop() != null ? entity.getLop() : 0.0)
            .totalAvailed(entity.getTotalAvailed() != null ? entity.getTotalAvailed() : 0.0)
            .clClosing(entity.getClClosing() != null ? entity.getClClosing() : 0.0)
            .plClosing(entity.getPlClosing() != null ? entity.getPlClosing() : 0.0)
            .lastWorkingDay(entity.getLastWorkingDay() != null ? entity.getLastWorkingDay() : "")
            .remarks(entity.getRemarks() != null ? entity.getRemarks() : "")
            .build();
    }
}
