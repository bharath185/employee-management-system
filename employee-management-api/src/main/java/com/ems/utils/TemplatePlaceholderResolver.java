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

        // System and Date variables
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        String formattedToday = today.format(DATE_FORMATTER); // dd-MM-yyyy e.g. 20-09-2026
        String formattedTodayLong = today.format(DateTimeFormatter.ofPattern("dd MMMM yyyy")); // 20 September 2026
        String formattedTime = now.format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        String currentYear = String.valueOf(today.getYear());
        String currentMonth = String.format("%02d", today.getMonthValue());
        String currentMonthName = today.getMonth().name();
        String currentDay = String.format("%02d", today.getDayOfMonth());

        values.put("current_date", formattedToday);
        values.put("currentdate", formattedToday);
        values.put("today", formattedToday);
        values.put("today_date", formattedToday);
        values.put("date", formattedToday);
        values.put("current_date_long", formattedTodayLong);
        values.put("current_time", formattedTime);
        values.put("current_year", currentYear);
        values.put("current_month", currentMonth);
        values.put("current_month_name", currentMonthName);
        values.put("current_day", currentDay);

        if (employee != null) {
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
            values.put("middle_name", nullSafe(employee.getMiddleName()));
            values.put("surname", nullSafe(employee.getSurname()));
            values.put("prefix", nullSafe(employee.getPrefix()));
            values.put("marital_status", nullSafe(employee.getMaritalStatus()));
            String resolvedFather = nullSafe(employee.getFatherHusbandName());
            if (resolvedFather.isEmpty()) {
                resolvedFather = nullSafe(employee.getFatherName());
            }
            values.put("father_husband_name", resolvedFather);
            values.put("father_name", resolvedFather);
            values.put("fathername", resolvedFather);
            values.put("father_or_husband_name", resolvedFather);
            values.put("father_husband", resolvedFather);
            values.put("f_m_h", nullSafe(employee.getFMH()));
            values.put("occupation_kin", nullSafe(employee.getOccupationKin()));
            values.put("occupation_kin_sub", nullSafe(employee.getOccupationKinSub()));
            values.put("ration_card", nullSafe(employee.getRationCard()));

            // Photo fields
            String photo = nullSafe(employee.getPhotoPath());
            String photoBase64 = resolvePhotoBase64(photo);
            values.put("photo_path", photo);
            values.put("photo_url", photoBase64);
            values.put("employee_photo_url", photoBase64);
            values.put("photo_src", photoBase64);
            values.put("employee_photo_src", photoBase64);
            if (!photoBase64.isEmpty()) {
                String imgTag = "<img src=\"" + photoBase64 + "\" alt=\"\" style=\"width:100%;height:100%;object-fit:cover;border-radius:3px;display:block;\" onerror=\"this.style.display='none'\" />";
                values.put("photo", imgTag);
                values.put("employee_photo", imgTag);
                values.put("photo_img", imgTag);
                values.put("employee_photo_img", imgTag);
            } else {
                values.put("photo", "");
                values.put("employee_photo", "");
                values.put("photo_img", "");
                values.put("employee_photo_img", "");
            }

            // Dates
            String dojStr = employee.getDoj() != null ? employee.getDoj().format(DATE_FORMATTER) : "";
            values.put("doj", dojStr);
            values.put("date_of_joining", dojStr);
            values.put("joining_date", dojStr);

            String doeStr = employee.getDoe() != null ? employee.getDoe().format(DATE_FORMATTER) : "";
            values.put("doe", doeStr);
            values.put("date_of_exit", doeStr);
            values.put("exit_date", doeStr);

            String dobStr = employee.getDob() != null ? employee.getDob().format(DATE_FORMATTER) : "";
            values.put("dob", dobStr);
            values.put("date_of_birth", dobStr);
            values.put("birth_date", dobStr);

            // Bank fields
            values.put("bank_name", nullSafe(employee.getBankName()));
            values.put("account_number", nullSafe(employee.getAccountNumber()));
            values.put("ifsc_code", nullSafe(employee.getIfscCode()));
            values.put("branch", nullSafe(employee.getBranch()));

            // Identity fields
            values.put("pan_number_employee", nullSafe(employee.getPanNumber()));
            values.put("aadhar_number", nullSafe(employee.getAadharNumber()));
            values.put("uan_no", nullSafe(employee.getUanNo()));
            values.put("pf_no", nullSafe(employee.getPfNo()));
            values.put("esic_no", nullSafe(employee.getEsicNo()));
            values.put("blood_group", nullSafe(employee.getBloodGroup()));

            // Education
            values.put("highest_qualification", nullSafe(employee.getHighestQualification()));
            values.put("level_of_education", nullSafe(employee.getLevelOfEducation()));
            values.put("year_of_passing", employee.getYearOfPassing() != null ? employee.getYearOfPassing().toString() : "");
            values.put("percentage_marks", employee.getPercentageMarks() != null ? employee.getPercentageMarks().toString() : "");

            // Address & contacts
            values.put("permanent_address", nullSafe(employee.getPermanentAddress()));
            values.put("close_relative_name", nullSafe(employee.getCloseRelativeName()));
            values.put("close_relative_mobile", nullSafe(employee.getCloseRelativeMobile()));

            // Demographics
            values.put("religion", nullSafe(employee.getReligion()));
            values.put("social_category", nullSafe(employee.getSocialCategory()));
            values.put("social_subcategory", nullSafe(employee.getSocialSubcategory()));

            // Assets
            values.put("has_tv", nullSafe(employee.getHasTv()));
            values.put("has_fridge", nullSafe(employee.getHasFridge()));
            values.put("has_laptop", nullSafe(employee.getHasLaptop()));
            values.put("has_wifi", nullSafe(employee.getHasWifi()));
            values.put("has_2wheeler", nullSafe(employee.getHas2wheeler()));
            values.put("has_4wheeler", nullSafe(employee.getHas4wheeler()));

            // Verification
            values.put("ssc_status", nullSafe(employee.getSscStatus()));
            values.put("intermediate_status", nullSafe(employee.getIntermediateStatus()));
            values.put("bachelors_degree", nullSafe(employee.getBachelorsDegree()));
            values.put("masters_degree", nullSafe(employee.getMastersDegree()));
            values.put("aadhaar_verification", nullSafe(employee.getAadhaarVerification()));
            values.put("pan_verification", nullSafe(employee.getPanVerification()));
            values.put("osv", nullSafe(employee.getOsv()));
            values.put("remarks", nullSafe(employee.getRemarks()));

            // Employment
            values.put("aadhar_seeding", nullSafe(employee.getAadharSeeding()));
            values.put("uan_activation", nullSafe(employee.getUanActivation()));
            values.put("languages_can_speak", nullSafe(employee.getLanguagesCanSpeak()));

            // Family
            values.put("father_name", nullSafe(employee.getFatherName()));
            values.put("father_phone", nullSafe(employee.getFatherPhone()));
            values.put("mother_name", nullSafe(employee.getMotherName()));
            values.put("mother_phone", nullSafe(employee.getMotherPhone()));
            values.put("spouse_name", nullSafe(employee.getSpouseName()));
            values.put("spouse_phone", nullSafe(employee.getSpousePhone()));

            // Experience
            values.put("past_experience", nullSafe(employee.getPastExperience()));
            values.put("organization_name", nullSafe(employee.getOrganizationName()));
            values.put("period_of_employment", nullSafe(employee.getPeriodOfEmployment()));

            // References
            values.put("ref1_name", nullSafe(employee.getRef1Name()));
            values.put("ref1_relationship", nullSafe(employee.getRef1Relationship()));
            values.put("ref1_address", nullSafe(employee.getRef1Address()));
            values.put("ref1_mobile", nullSafe(employee.getRef1Mobile()));
            values.put("ref2_name", nullSafe(employee.getRef2Name()));
            values.put("ref2_relationship", nullSafe(employee.getRef2Relationship()));
            values.put("ref2_address", nullSafe(employee.getRef2Address()));
            values.put("ref2_mobile", nullSafe(employee.getRef2Mobile()));

            // Exit details
            values.put("deletion_month", nullSafe(employee.getDeletionMonth()));
            values.put("exit_type", nullSafe(employee.getExitType()));
            values.put("exit_reason", nullSafe(employee.getExitReason()));

            // Employee status
            values.put("employee_status", nullSafe(employee.getEmployeeStatus()));

            // Custom fields parsing
            if (employee.getCustomFields() != null && !employee.getCustomFields().trim().isEmpty()) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    Map<String, Object> customMap = mapper.readValue(
                            employee.getCustomFields(),
                            new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}
                    );
                    if (customMap != null) {
                        for (Map.Entry<String, Object> entry : customMap.entrySet()) {
                            if (entry.getValue() != null) {
                                String val = String.valueOf(entry.getValue());
                                values.put(entry.getKey(), val);
                                values.put(entry.getKey().toLowerCase(), val);
                            }
                        }
                    }
                } catch (Exception ignored) {
                    // Ignore JSON parse issues in custom fields
                }
            }
        }

        // Company fields (with prefix "company_")
        if (company != null) {
            values.put("company_name", nullSafe(company.getCompanyName()));
            values.put("company_address", nullSafe(company.getAddress()));
            values.put("company_office_address", nullSafe(company.getAddress()));
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
            String companyLogoBase64 = resolveCompanyLogoBase64(company.getLogoPath());
            values.put("company_logo", companyLogoBase64);
            values.put("company_logo_url", companyLogoBase64);
            values.put("company_logo_src", companyLogoBase64);
            values.put("logo", companyLogoBase64);
        } else {
            values.put("company_name", "");
            values.put("company_address", "");
            values.put("company_office_address", "");
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
            values.put("company_logo", "");
            values.put("company_logo_url", "");
            values.put("company_logo_src", "");
            values.put("logo", "");
        }

        return values;
    }

    private static String resolveCompanyLogoBase64(String logoPath) {
        if (logoPath == null || logoPath.trim().isEmpty()) {
            return "";
        }
        String raw = logoPath.trim();
        if (raw.startsWith("data:image/")) {
            return raw;
        }
        String fileName = raw.contains("/") ? raw.substring(raw.lastIndexOf('/') + 1) : raw;
        if (fileName.contains("\\")) {
            fileName = fileName.substring(fileName.lastIndexOf('\\') + 1);
        }
        java.nio.file.Path[] candidatePaths = new java.nio.file.Path[] {
            java.nio.file.Paths.get("data/uploads/company").resolve(fileName),
            java.nio.file.Paths.get("uploads/company").resolve(fileName),
            java.nio.file.Paths.get("data", "uploads", "company", fileName),
            java.nio.file.Paths.get("uploads", "company", fileName),
            java.nio.file.Paths.get(raw)
        };
        for (java.nio.file.Path p : candidatePaths) {
            if (java.nio.file.Files.exists(p) && java.nio.file.Files.isRegularFile(p)) {
                try {
                    byte[] bytes = java.nio.file.Files.readAllBytes(p);
                    String mime = java.nio.file.Files.probeContentType(p);
                    if (mime == null || mime.isBlank()) {
                        String name = p.getFileName().toString().toLowerCase();
                        mime = name.endsWith(".png") ? "image/png"
                            : name.endsWith(".gif") ? "image/gif"
                            : name.endsWith(".webp") ? "image/webp"
                            : name.endsWith(".svg") ? "image/svg+xml"
                            : "image/jpeg";
                    }
                    return "data:" + mime + ";base64," + java.util.Base64.getEncoder().encodeToString(bytes);
                } catch (Exception ignored) {}
            }
        }
        return "";
    }

    private static String resolvePhotoBase64(String photoPath) {
        if (photoPath == null || photoPath.trim().isEmpty()) {
            return "";
        }
        String raw = photoPath.trim();
        if (raw.startsWith("data:image/")) {
            return raw;
        }
        String fileName = raw.contains("/") ? raw.substring(raw.lastIndexOf('/') + 1) : raw;
        if (fileName.contains("\\")) {
            fileName = fileName.substring(fileName.lastIndexOf('\\') + 1);
        }
        java.nio.file.Path[] candidatePaths = new java.nio.file.Path[] {
            java.nio.file.Paths.get("data/uploads/photos").resolve(fileName),
            java.nio.file.Paths.get("uploads/photos").resolve(fileName),
            java.nio.file.Paths.get("data", "uploads", "photos", fileName),
            java.nio.file.Paths.get("uploads", "photos", fileName),
            java.nio.file.Paths.get(raw)
        };
        for (java.nio.file.Path p : candidatePaths) {
            if (java.nio.file.Files.exists(p) && java.nio.file.Files.isRegularFile(p)) {
                try {
                    byte[] bytes = java.nio.file.Files.readAllBytes(p);
                    String mime = java.nio.file.Files.probeContentType(p);
                    if (mime == null || mime.isBlank()) {
                        String name = p.getFileName().toString().toLowerCase();
                        mime = name.endsWith(".png") ? "image/png"
                            : name.endsWith(".gif") ? "image/gif"
                            : name.endsWith(".webp") ? "image/webp"
                            : "image/jpeg";
                    }
                    return "data:" + mime + ";base64," + java.util.Base64.getEncoder().encodeToString(bytes);
                } catch (Exception ignored) {}
            }
        }
        return "";
    }

    private static String nullSafe(String value) {
        return value != null ? value : "";
    }
}
