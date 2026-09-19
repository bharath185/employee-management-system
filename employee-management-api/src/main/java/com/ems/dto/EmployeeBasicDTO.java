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
    private String prefix;
    private String firstName;
    private String middleName;
    private String surname;
    private String fullName;
    private String email;
    private String photoPath;
    private String designation;
    private String employeeStatus;

    public static EmployeeBasicDTO fromEntity(Employee emp) {
        if (emp == null) return null;
        return EmployeeBasicDTO.builder()
            .id(emp.getId())
            .employeeCode(emp.getEmployeeCode())
            .prefix(emp.getPrefix())
            .firstName(emp.getFirstName())
            .middleName(emp.getMiddleName())
            .surname(emp.getSurname())
            .fullName(emp.getFullName())
            .email(emp.getEmail())
            .photoPath(emp.getPhotoPath())
            .designation(emp.getDesignation())
            .employeeStatus(emp.getEmployeeStatus())
            .build();
    }
}
