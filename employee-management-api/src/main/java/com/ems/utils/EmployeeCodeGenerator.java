package com.ems.utils;

import com.ems.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EmployeeCodeGenerator {

    private final EmployeeRepository employeeRepository;

    public String generateNextCode() {
        String maxCode = employeeRepository.findMaxEmployeeCode();
        if (maxCode == null || maxCode.isEmpty()) {
            return "EMP0001";
        }
        int number;
        try {
            String numPart = maxCode.substring(3);
            number = Integer.parseInt(numPart);
        } catch (NumberFormatException e) {
            number = 0;
        }
        return String.format("EMP%04d", number + 1);
    }
}
