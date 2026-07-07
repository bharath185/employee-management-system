package com.ems.utils;

import com.ems.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EmployeeCodeGenerator {

    private final EmployeeRepository employeeRepository;

    private static final String PREFIX = "PARI";
    private static final int NUMBER_LENGTH = 3;

    public String generateNextCode() {
        String maxCode = employeeRepository.findMaxEmployeeCode();
        int startNumber = 0;
        if (maxCode != null && !maxCode.isEmpty() && maxCode.startsWith(PREFIX)) {
            try {
                String numPart = maxCode.substring(PREFIX.length());
                startNumber = Integer.parseInt(numPart);
            } catch (NumberFormatException e) {
                startNumber = 0;
            }
        }

        // Retry loop to handle race conditions or existing mixed codes
        int attempts = 0;
        int number = startNumber;
        while (attempts < 1000) {
            number++;
            String code = PREFIX + String.format("%0" + NUMBER_LENGTH + "d", number);
            if (!employeeRepository.existsByEmployeeCodeIncludingDeleted(code)) {
                return code;
            }
            attempts++;
        }
        throw new IllegalStateException("Unable to generate a unique employee code after " + attempts + " attempts");
    }
}
