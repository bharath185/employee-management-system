package com.ems.dto;

import com.ems.model.Employee;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeBasicDTO {
    private Long id;
    private String employeeCode;
    private String firstName;
    private String surname;
    private String email;
    private String photoPath;
    private String designation;
    private String employeeStatus;

    public static EmployeeBasicDTO fromEntity(Employee emp) {
        if (emp == null) return null;
        return EmployeeBasicDTO.builder()
            .id(emp.getId())
            .employeeCode(emp.getEmployeeCode())
            .firstName(emp.getFirstName())
            .surname(emp.getSurname())
            .email(emp.getEmail())
            .photoPath(emp.getPhotoPath())
            .designation(emp.getDesignation())
            .employeeStatus(emp.getEmployeeStatus())
            .build();
    }
}
