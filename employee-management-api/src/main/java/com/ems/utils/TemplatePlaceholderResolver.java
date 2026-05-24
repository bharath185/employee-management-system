package com.ems.utils;

import com.ems.model.Company;
import com.ems.model.Employee;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Resolves template placeholders by building a map of employee and company data.
 */
public final class TemplatePlaceholderResolver {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    private TemplatePlaceholderResolver() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * Builds a map of all placeholder variables from employee and company data.
     */
    public static Map<String, String> resolve(Employee employee, Company company) {
        Map<String, String> values = new HashMap<>();

        // Employee fields
        values.put("employee_name", employee.getFullName());
        values.put("employee_code", nullSafe(employee.getEmployeeCode()));
        values.put("designation", nullSafe(employee.getDesignation()));
        values.put("department", nullSafe(employee.getProcessAssigned()));
        values.put("gender", nullSafe(employee.getGender()));
        values.put("address", nullSafe(employee.getPresentAddress()));
        values.put("mobile", nullSafe(employee.getMobile()));
        values.put("email", nullSafe(employee.getEmail()));
        values.put("first_name", nullSafe(employee.getFirstName()));
        values.put("surname", nullSafe(employee.getSurname()));

        // Dates
        values.put("doj", employee.getDoj() != null ? employee.getDoj().format(DATE_FORMATTER) : "");
        values.put("doe", employee.getDoe() != null ? employee.getDoe().format(DATE_FORMATTER) : "");
        values.put("dob", employee.getDob() != null ? employee.getDob().format(DATE_FORMATTER) : "");

        // Bank fields
        values.put("bank_name", nullSafe(employee.getBankName()));
        values.put("account_number", nullSafe(employee.getAccountNumber()));
        values.put("ifsc_code", nullSafe(employee.getIfscCode()));

        // Identity fields
        values.put("pan_number_employee", nullSafe(employee.getPanNumber()));
        values.put("aadhar_number", nullSafe(employee.getAadharNumber()));
        values.put("uan_no", nullSafe(employee.getUanNo()));
        values.put("pf_no", nullSafe(employee.getPfNo()));
        values.put("esic_no", nullSafe(employee.getEsicNo()));

        // Employee status
        values.put("employee_status", nullSafe(employee.getEmployeeStatus()));

        // Company fields (with prefix "company_")
        if (company != null) {
            values.put("company_name", nullSafe(company.getCompanyName()));
            values.put("company_address", nullSafe(company.getAddress()));
            values.put("company_phone", nullSafe(company.getPhone()));
            values.put("company_email", nullSafe(company.getEmail()));
            values.put("company_website", nullSafe(company.getWebsite()));
            values.put("company_gst", nullSafe(company.getGstNumber()));
            values.put("company_pan", nullSafe(company.getPanNumber()));
            values.put("company_tan", nullSafe(company.getTanNumber()));
            values.put("company_cin", nullSafe(company.getCinNumber()));
            values.put("company_registration", nullSafe(company.getRegistrationNumber()));
            values.put("authorized_signatory", nullSafe(company.getAuthorizedSignatory()));
            values.put("incorporated_date", company.getIncorporatedDate() != null
                ? company.getIncorporatedDate().format(DATE_FORMATTER) : "");
        } else {
            values.put("company_name", "");
            values.put("company_address", "");
            values.put("company_phone", "");
            values.put("company_email", "");
            values.put("company_website", "");
            values.put("company_gst", "");
            values.put("company_pan", "");
            values.put("company_tan", "");
            values.put("company_cin", "");
            values.put("company_registration", "");
            values.put("authorized_signatory", "");
            values.put("incorporated_date", "");
        }

        // Current date
        values.put("current_date", java.time.LocalDate.now().format(DATE_FORMATTER));
        values.put("current_year", String.valueOf(java.time.LocalDate.now().getYear()));

        return values;
    }

    private static String nullSafe(String value) {
        return value != null ? value : "";
    }
}
