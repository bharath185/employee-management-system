package com.ems.utils;

import com.ems.model.Employee;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.usermodel.XSSFName;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component
public class ExcelHelper {

    private static final String[] HEADERS;

    private static final String[] BASE_HEADERS = {
        "Employee Code", "Prefix", "First Name", "Surname", "Gender",
        "Marital Status", "Father/Husband Name", "F/M/H", "Occupation of Kin",
        "Occupation Kin Sub", "Ration Card", "DOJ", "Highest Qualification",
        "Level of Education", "Year of Passing", "% of Marks", "DOB",
        "Present Address", "Permanent Address", "Email", "Mobile",
        "Close Relative Name", "Close Relative Mobile", "Religion",
        "Social Category", "Social Subcategory", "TV", "Fridge", "Laptop",
        "WiFi", "2 Wheeler", "4 Wheeler", "Blood Group", "Aadhar Number",
        "PAN", "SSC Status", "Intermediate Status", "Bachelor Degree",
        "Master Degree", "Aadhaar Verification", "PAN Verification", "OSV",
        "Remarks", "Bank Name", "Account Number", "IFSC Code", "Branch",
        "Employee Status", "Process Assigned", "ESIC No.", "Aadhar Seeding",
        "UAN No.", "PF No.", "UAN Activation", "Languages", "Father Name",
        "Father Phone", "Mother Name", "Mother Phone", "Spouse Name",
        "Spouse Phone", "Past Experience", "Organization", "Employment Period",
        "Ref1 Name", "Ref1 Relationship", "Ref1 Address", "Ref1 Mobile",
        "Ref2 Name", "Ref2 Relationship", "Ref2 Address", "Ref2 Mobile",
        "Designation", "DOE", "Deletion Month", "Exit Type", "Exit Reason"
    };

    private static final String[] LANGUAGE_NAMES = {
        "Telugu", "English"
    };

    static {
        List<String> allHeaders = new ArrayList<>(Arrays.asList(BASE_HEADERS));
        for (String lang : LANGUAGE_NAMES) {
            allHeaders.add("Language_" + lang + "_Read");
            allHeaders.add("Language_" + lang + "_Write");
            allHeaders.add("Language_" + lang + "_Speak");
        }
        HEADERS = allHeaders.toArray(new String[0]);
    }

    // Maps column index -> master data category for dropdowns
    private static final Map<Integer, String> COLUMN_MASTER_CATEGORY = new LinkedHashMap<>();
    // Maps column index -> human-readable field name for validation errors
    private static final Map<Integer, String> COLUMN_FIELD_NAME = new LinkedHashMap<>();

    static {
        COLUMN_FIELD_NAME.put(1, "Prefix");
        COLUMN_MASTER_CATEGORY.put(1, "PREFIX");
        COLUMN_FIELD_NAME.put(4, "Gender");
        COLUMN_MASTER_CATEGORY.put(4, "GENDER");
        COLUMN_FIELD_NAME.put(5, "Marital Status");
        COLUMN_MASTER_CATEGORY.put(5, "MARITAL_STATUS");
        COLUMN_FIELD_NAME.put(7, "F/M/H");
        COLUMN_MASTER_CATEGORY.put(7, "F_M_H");
        COLUMN_FIELD_NAME.put(8, "Occupation of Kin");
        COLUMN_MASTER_CATEGORY.put(8, "OCCUPATION_KIN");
        COLUMN_FIELD_NAME.put(23, "Religion");
        COLUMN_MASTER_CATEGORY.put(23, "RELIGION");
        COLUMN_FIELD_NAME.put(24, "Social Category");
        COLUMN_MASTER_CATEGORY.put(24, "SOCIAL_CATEGORY");
        COLUMN_FIELD_NAME.put(25, "Social Subcategory");
        COLUMN_MASTER_CATEGORY.put(25, "SOCIAL_SUBCATEGORY");
        COLUMN_FIELD_NAME.put(32, "Blood Group");
        COLUMN_MASTER_CATEGORY.put(32, "BLOOD_GROUP");
        COLUMN_FIELD_NAME.put(46, "Employee Status");
        COLUMN_MASTER_CATEGORY.put(46, "EMPLOYEE_STATUS");
        COLUMN_FIELD_NAME.put(74, "Designation");
        COLUMN_MASTER_CATEGORY.put(74, "DESIGNATION");
        COLUMN_FIELD_NAME.put(76, "Exit Type");
        COLUMN_MASTER_CATEGORY.put(76, "EXIT_TYPE");

        // Yes/No fields
        int[] yesNoColumns = {26, 27, 28, 29, 30, 31, 35, 36, 37, 38, 39, 40, 41, 49, 52, 57};
        String[] yesNoNames = {"TV", "Fridge", "Laptop", "WiFi", "2 Wheeler", "4 Wheeler",
                "SSC Status", "Intermediate Status", "Bachelor Degree", "Master Degree",
                "Aadhaar Verification", "PAN Verification", "OSV", "Aadhar Seeding",
                "UAN Activation", "Past Experience"};
        for (int i = 0; i < yesNoColumns.length; i++) {
            COLUMN_FIELD_NAME.put(yesNoColumns[i], yesNoNames[i]);
            COLUMN_MASTER_CATEGORY.put(yesNoColumns[i], "YES_NO");
        }

        // Language columns (appended after base headers)
        int langColStart = BASE_HEADERS.length;
        for (int i = 0; i < LANGUAGE_NAMES.length; i++) {
            int readIdx = langColStart + i * 3;
            int writeIdx = langColStart + i * 3 + 1;
            int speakIdx = langColStart + i * 3 + 2;
            COLUMN_FIELD_NAME.put(readIdx, "Language_" + LANGUAGE_NAMES[i] + "_Read");
            COLUMN_MASTER_CATEGORY.put(readIdx, "YES_NO");
            COLUMN_FIELD_NAME.put(writeIdx, "Language_" + LANGUAGE_NAMES[i] + "_Write");
            COLUMN_MASTER_CATEGORY.put(writeIdx, "YES_NO");
            COLUMN_FIELD_NAME.put(speakIdx, "Language_" + LANGUAGE_NAMES[i] + "_Speak");
            COLUMN_MASTER_CATEGORY.put(speakIdx, "YES_NO");
        }
    }

    public byte[] exportToExcel(List<Employee> employees, Map<String, List<String>> masterDataOptions) {
        return exportToExcel(employees, masterDataOptions, Collections.emptyMap());
    }

    public byte[] exportToExcel(List<Employee> employees, Map<String, List<String>> masterDataOptions,
            Map<Long, List<com.ems.dto.EmployeeLanguageDTO>> employeeLanguages) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Employees");

            // Header row styling
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Create header row
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 1;
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            for (Employee emp : employees) {
                Row row = sheet.createRow(rowNum++);
                int col = 0;

                setCellValue(row, col++, emp.getEmployeeCode());
                setCellValue(row, col++, emp.getPrefix());
                setCellValue(row, col++, emp.getFirstName());
                setCellValue(row, col++, emp.getSurname());
                setCellValue(row, col++, emp.getGender());
                setCellValue(row, col++, emp.getMaritalStatus());
                setCellValue(row, col++, emp.getFatherHusbandName());
                setCellValue(row, col++, emp.getFMH());
                setCellValue(row, col++, emp.getOccupationKin());
                setCellValue(row, col++, emp.getOccupationKinSub());
                setCellValue(row, col++, emp.getRationCard());
                setCellValue(row, col++, emp.getDoj() != null ? emp.getDoj().format(dateFormatter) : "");
                setCellValue(row, col++, emp.getHighestQualification());
                setCellValue(row, col++, emp.getLevelOfEducation());
                setCellValue(row, col++, emp.getYearOfPassing() != null ? emp.getYearOfPassing().toString() : "");
                setCellValue(row, col++, emp.getPercentageMarks() != null ? emp.getPercentageMarks().toString() : "");
                setCellValue(row, col++, emp.getDob() != null ? emp.getDob().format(dateFormatter) : "");
                setCellValue(row, col++, emp.getPresentAddress());
                setCellValue(row, col++, emp.getPermanentAddress());
                setCellValue(row, col++, emp.getEmail());
                setCellValue(row, col++, emp.getMobile());
                setCellValue(row, col++, emp.getCloseRelativeName());
                setCellValue(row, col++, emp.getCloseRelativeMobile());
                setCellValue(row, col++, emp.getReligion());
                setCellValue(row, col++, emp.getSocialCategory());
                setCellValue(row, col++, emp.getSocialSubcategory());
                setCellValue(row, col++, emp.getHasTv());
                setCellValue(row, col++, emp.getHasFridge());
                setCellValue(row, col++, emp.getHasLaptop());
                setCellValue(row, col++, emp.getHasWifi());
                setCellValue(row, col++, emp.getHas2wheeler());
                setCellValue(row, col++, emp.getHas4wheeler());
                setCellValue(row, col++, emp.getBloodGroup());
                setCellValue(row, col++, emp.getAadharNumber());
                setCellValue(row, col++, emp.getPanNumber());
                setCellValue(row, col++, emp.getSscStatus());
                setCellValue(row, col++, emp.getIntermediateStatus());
                setCellValue(row, col++, emp.getBachelorsDegree());
                setCellValue(row, col++, emp.getMastersDegree());
                setCellValue(row, col++, emp.getAadhaarVerification());
                setCellValue(row, col++, emp.getPanVerification());
                setCellValue(row, col++, emp.getOsv());
                setCellValue(row, col++, emp.getRemarks());
                setCellValue(row, col++, emp.getBankName());
                setCellValue(row, col++, emp.getAccountNumber());
                setCellValue(row, col++, emp.getIfscCode());
                setCellValue(row, col++, emp.getBranch());
                setCellValue(row, col++, emp.getEmployeeStatus());
                setCellValue(row, col++, emp.getProcessAssigned());
                setCellValue(row, col++, emp.getEsicNo());
                setCellValue(row, col++, emp.getAadharSeeding());
                setCellValue(row, col++, emp.getUanNo());
                setCellValue(row, col++, emp.getPfNo());
                setCellValue(row, col++, emp.getUanActivation());
                setCellValue(row, col++, emp.getLanguagesCanSpeak());
                setCellValue(row, col++, emp.getFatherName());
                setCellValue(row, col++, emp.getFatherPhone());
                setCellValue(row, col++, emp.getMotherName());
                setCellValue(row, col++, emp.getMotherPhone());
                setCellValue(row, col++, emp.getSpouseName());
                setCellValue(row, col++, emp.getSpousePhone());
                setCellValue(row, col++, emp.getPastExperience());
                setCellValue(row, col++, emp.getOrganizationName());
                setCellValue(row, col++, emp.getPeriodOfEmployment());
                setCellValue(row, col++, emp.getRef1Name());
                setCellValue(row, col++, emp.getRef1Relationship());
                setCellValue(row, col++, emp.getRef1Address());
                setCellValue(row, col++, emp.getRef1Mobile());
                setCellValue(row, col++, emp.getRef2Name());
                setCellValue(row, col++, emp.getRef2Relationship());
                setCellValue(row, col++, emp.getRef2Address());
                setCellValue(row, col++, emp.getRef2Mobile());
                setCellValue(row, col++, emp.getDesignation());
                setCellValue(row, col++, emp.getDoe() != null ? emp.getDoe().format(dateFormatter) : "");
                setCellValue(row, col++, emp.getDeletionMonth());
                setCellValue(row, col++, emp.getExitType());
                setCellValue(row, col++, emp.getExitReason());

                // Write language columns
                List<com.ems.dto.EmployeeLanguageDTO> langs = employeeLanguages.getOrDefault(emp.getId(), Collections.emptyList());
                Map<String, com.ems.dto.EmployeeLanguageDTO> langMap = new HashMap<>();
                for (com.ems.dto.EmployeeLanguageDTO l : langs) {
                    langMap.put(l.getLanguage().toUpperCase(), l);
                }
                for (String langName : LANGUAGE_NAMES) {
                    com.ems.dto.EmployeeLanguageDTO l = langMap.get(langName.toUpperCase());
                    setCellValue(row, col++, l != null && l.isCanRead() ? "YES" : "NO");
                    setCellValue(row, col++, l != null && l.isCanWrite() ? "YES" : "NO");
                    setCellValue(row, col++, l != null && l.isCanSpeak() ? "YES" : "NO");
                }
            }

            // Add dropdown validations
            addDropdownValidations(sheet, masterDataOptions);

            // Auto-size columns
            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to export Excel file", e);
        }
    }

    public byte[] generateSampleExcel(Map<String, List<String>> masterDataOptions) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Employees");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("PARI001");
            sampleRow.createCell(1).setCellValue("MR");
            sampleRow.createCell(2).setCellValue("John");
            sampleRow.createCell(3).setCellValue("Doe");
            sampleRow.createCell(4).setCellValue("MALE");
            sampleRow.createCell(5).setCellValue("MARRIED");
            sampleRow.createCell(6).setCellValue("Robert Doe");
            sampleRow.createCell(7).setCellValue("FATHER");
            sampleRow.createCell(8).setCellValue("SALARIED");
            sampleRow.createCell(11).setCellValue("01/01/2024");
            sampleRow.createCell(16).setCellValue("01/01/1990");
            sampleRow.createCell(19).setCellValue("john.doe@example.com");
            sampleRow.createCell(20).setCellValue("9876543210");
            sampleRow.createCell(22).setCellValue("9876543210");
            sampleRow.createCell(26).setCellValue("YES");
            sampleRow.createCell(27).setCellValue("YES");
            sampleRow.createCell(32).setCellValue("A+");
            sampleRow.createCell(33).setCellValue("123456789012");
            sampleRow.createCell(34).setCellValue("ABCDE1234F");
            sampleRow.createCell(46).setCellValue("LIVE");
            sampleRow.createCell(74).setCellValue("MANAGER");

            // Sample language data
            int langCol = BASE_HEADERS.length;
            for (String langName : LANGUAGE_NAMES) {
                sampleRow.createCell(langCol++).setCellValue("YES");
                sampleRow.createCell(langCol++).setCellValue("YES");
                sampleRow.createCell(langCol++).setCellValue("YES");
            }

            // Add dropdown validations
            addDropdownValidations(sheet, masterDataOptions);

            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate sample Excel", e);
        }
    }

    private void addDropdownValidations(Sheet sheet, Map<String, List<String>> masterDataOptions) {
        if (masterDataOptions == null || masterDataOptions.isEmpty()) {
            return;
        }

        Workbook workbook = sheet.getWorkbook();
        Sheet dropdownSheet = workbook.createSheet("DropdownOptions");
        workbook.setSheetHidden(workbook.getSheetIndex(dropdownSheet), true);

        int columnIndex = 0;
        Map<String, String> categoryToNamedRange = new HashMap<>();

        for (Map.Entry<String, List<String>> entry : masterDataOptions.entrySet()) {
            String category = entry.getKey();
            List<String> options = entry.getValue();
            if (options == null || options.isEmpty()) continue;

            String rangeName = category.replaceAll("[^a-zA-Z0-9_]", "_");
            categoryToNamedRange.put(category, rangeName);

            // Header for the options column
            Row headerRow = dropdownSheet.getRow(0);
            if (headerRow == null) {
                headerRow = dropdownSheet.createRow(0);
            }
            Cell headerCell = headerRow.createCell(columnIndex);
            headerCell.setCellValue(category);

            // Write options
            for (int i = 0; i < options.size(); i++) {
                Row row = dropdownSheet.getRow(i + 1);
                if (row == null) {
                    row = dropdownSheet.createRow(i + 1);
                }
                Cell cell = row.createCell(columnIndex);
                cell.setCellValue(options.get(i));
            }

            // Create named range for this category
            String reference = "DropdownOptions!$" +
                    CellReference.convertNumToColString(columnIndex) + "$2:$" +
                    CellReference.convertNumToColString(columnIndex) + "$" + (options.size() + 1);
            XSSFName namedRange = (XSSFName) workbook.createName();
            namedRange.setNameName(rangeName);
            namedRange.setRefersToFormula(reference);

            columnIndex++;
        }

        // Apply data validation to columns
        DataValidationHelper validationHelper = sheet.getDataValidationHelper();
        for (Map.Entry<Integer, String> entry : COLUMN_MASTER_CATEGORY.entrySet()) {
            int colIndex = entry.getKey();
            String category = entry.getValue();
            String rangeName = categoryToNamedRange.get(category);
            if (rangeName == null) continue;

            DataValidationConstraint constraint = validationHelper.createFormulaListConstraint(rangeName);
            CellRangeAddressList addressList = new CellRangeAddressList(1, 1000, colIndex, colIndex);
            DataValidation validation = validationHelper.createValidation(constraint, addressList);
            validation.setSuppressDropDownArrow(true);
            validation.setShowErrorBox(true);
            validation.createErrorBox("Invalid Value", "Please select a value from the dropdown list.");
            sheet.addValidationData(validation);
        }
    }

    public List<Employee> importFromExcel(InputStream inputStream) {
        List<Employee> employees = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet.getPhysicalNumberOfRows() <= 1) {
                return employees; // Only header row, no data
            }

            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                Employee emp = new Employee();
                int col = 0;

                emp.setEmployeeCode(getCellStringValue(row, col++));
                emp.setPrefix(getCellStringValue(row, col++));
                emp.setFirstName(getCellStringValue(row, col++));
                emp.setSurname(getCellStringValue(row, col++));
                emp.setGender(getCellStringValue(row, col++));
                emp.setMaritalStatus(getCellStringValue(row, col++));
                emp.setFatherHusbandName(getCellStringValue(row, col++));
                emp.setFMH(getCellStringValue(row, col++));
                emp.setOccupationKin(getCellStringValue(row, col++));
                emp.setOccupationKinSub(getCellStringValue(row, col++));
                emp.setRationCard(getCellStringValue(row, col++));
                emp.setDoj(parseDate(getCellStringValue(row, col++), dateFormatter));
                emp.setHighestQualification(getCellStringValue(row, col++));
                emp.setLevelOfEducation(getCellStringValue(row, col++));
                emp.setYearOfPassing(parseInt(getCellStringValue(row, col++)));
                emp.setPercentageMarks(parseDecimal(getCellStringValue(row, col++)));
                emp.setDob(parseDate(getCellStringValue(row, col++), dateFormatter));
                emp.setPresentAddress(getCellStringValue(row, col++));
                emp.setPermanentAddress(getCellStringValue(row, col++));
                emp.setEmail(getCellStringValue(row, col++));
                emp.setMobile(getCellStringValue(row, col++));
                emp.setCloseRelativeName(getCellStringValue(row, col++));
                emp.setCloseRelativeMobile(getCellStringValue(row, col++));
                emp.setReligion(getCellStringValue(row, col++));
                emp.setSocialCategory(getCellStringValue(row, col++));
                emp.setSocialSubcategory(getCellStringValue(row, col++));
                emp.setHasTv(getCellStringValue(row, col++));
                emp.setHasFridge(getCellStringValue(row, col++));
                emp.setHasLaptop(getCellStringValue(row, col++));
                emp.setHasWifi(getCellStringValue(row, col++));
                emp.setHas2wheeler(getCellStringValue(row, col++));
                emp.setHas4wheeler(getCellStringValue(row, col++));
                emp.setBloodGroup(getCellStringValue(row, col++));
                emp.setAadharNumber(getCellStringValue(row, col++));
                emp.setPanNumber(getCellStringValue(row, col++));
                emp.setSscStatus(getCellStringValue(row, col++));
                emp.setIntermediateStatus(getCellStringValue(row, col++));
                emp.setBachelorsDegree(getCellStringValue(row, col++));
                emp.setMastersDegree(getCellStringValue(row, col++));
                emp.setAadhaarVerification(getCellStringValue(row, col++));
                emp.setPanVerification(getCellStringValue(row, col++));
                emp.setOsv(getCellStringValue(row, col++));
                emp.setRemarks(getCellStringValue(row, col++));
                emp.setBankName(getCellStringValue(row, col++));
                emp.setAccountNumber(getCellStringValue(row, col++));
                emp.setIfscCode(getCellStringValue(row, col++));
                emp.setBranch(getCellStringValue(row, col++));
                emp.setEmployeeStatus(getCellStringValue(row, col++));
                emp.setProcessAssigned(getCellStringValue(row, col++));
                emp.setEsicNo(getCellStringValue(row, col++));
                emp.setAadharSeeding(getCellStringValue(row, col++));
                emp.setUanNo(getCellStringValue(row, col++));
                emp.setPfNo(getCellStringValue(row, col++));
                emp.setUanActivation(getCellStringValue(row, col++));
                emp.setLanguagesCanSpeak(getCellStringValue(row, col++));
                emp.setFatherName(getCellStringValue(row, col++));
                emp.setFatherPhone(getCellStringValue(row, col++));
                emp.setMotherName(getCellStringValue(row, col++));
                emp.setMotherPhone(getCellStringValue(row, col++));
                emp.setSpouseName(getCellStringValue(row, col++));
                emp.setSpousePhone(getCellStringValue(row, col++));
                emp.setPastExperience(getCellStringValue(row, col++));
                emp.setOrganizationName(getCellStringValue(row, col++));
                emp.setPeriodOfEmployment(getCellStringValue(row, col++));
                emp.setRef1Name(getCellStringValue(row, col++));
                emp.setRef1Relationship(getCellStringValue(row, col++));
                emp.setRef1Address(getCellStringValue(row, col++));
                emp.setRef1Mobile(getCellStringValue(row, col++));
                emp.setRef2Name(getCellStringValue(row, col++));
                emp.setRef2Relationship(getCellStringValue(row, col++));
                emp.setRef2Address(getCellStringValue(row, col++));
                emp.setRef2Mobile(getCellStringValue(row, col++));
                emp.setDesignation(getCellStringValue(row, col++));
                emp.setDoe(parseDate(getCellStringValue(row, col++), dateFormatter));
                emp.setDeletionMonth(getCellStringValue(row, col++));
                emp.setExitType(getCellStringValue(row, col++));
                emp.setExitReason(getCellStringValue(row, col++));

                // Parse language columns
                List<com.ems.dto.EmployeeLanguageDTO> langList = new ArrayList<>();
                for (String langName : LANGUAGE_NAMES) {
                    String readVal = col < row.getLastCellNum() ? getCellStringValue(row, col++) : "NO";
                    String writeVal = col < row.getLastCellNum() ? getCellStringValue(row, col++) : "NO";
                    String speakVal = col < row.getLastCellNum() ? getCellStringValue(row, col++) : "NO";
                    if ("YES".equalsIgnoreCase(readVal) || "YES".equalsIgnoreCase(writeVal) || "YES".equalsIgnoreCase(speakVal)) {
                        langList.add(com.ems.dto.EmployeeLanguageDTO.builder()
                            .language(langName.toUpperCase())
                            .canRead("YES".equalsIgnoreCase(readVal))
                            .canWrite("YES".equalsIgnoreCase(writeVal))
                            .canSpeak("YES".equalsIgnoreCase(speakVal))
                            .build());
                    }
                }
                if (!langList.isEmpty()) {
                    emp.setImportLanguages(langList);
                }

                employees.add(emp);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse Excel file", e);
        }
        return employees;
    }

    /**
     * Validates master-data-driven fields of an imported employee.
     * Returns a list of validation error messages; empty list means valid.
     */
    public List<String> validateEmployeeMasterData(Employee emp, Map<String, Set<String>> masterDataCodes) {
        List<String> errors = new ArrayList<>();
        if (masterDataCodes == null || masterDataCodes.isEmpty()) {
            return errors;
        }

        validateValue(errors, "Prefix", emp.getPrefix(), masterDataCodes.get("PREFIX"));
        validateValue(errors, "Gender", emp.getGender(), masterDataCodes.get("GENDER"));
        validateValue(errors, "Marital Status", emp.getMaritalStatus(), masterDataCodes.get("MARITAL_STATUS"));
        validateValue(errors, "F/M/H", emp.getFMH(), masterDataCodes.get("F_M_H"));
        validateValue(errors, "Occupation of Kin", emp.getOccupationKin(), masterDataCodes.get("OCCUPATION_KIN"));
        validateValue(errors, "Religion", emp.getReligion(), masterDataCodes.get("RELIGION"));
        validateValue(errors, "Social Category", emp.getSocialCategory(), masterDataCodes.get("SOCIAL_CATEGORY"));
        validateValue(errors, "Social Subcategory", emp.getSocialSubcategory(), masterDataCodes.get("SOCIAL_SUBCATEGORY"));
        validateValue(errors, "Blood Group", emp.getBloodGroup(), masterDataCodes.get("BLOOD_GROUP"));
        validateValue(errors, "Employee Status", emp.getEmployeeStatus(), masterDataCodes.get("EMPLOYEE_STATUS"));
        validateValue(errors, "Designation", emp.getDesignation(), masterDataCodes.get("DESIGNATION"));
        validateValue(errors, "Exit Type", emp.getExitType(), masterDataCodes.get("EXIT_TYPE"));

        Set<String> yesNo = masterDataCodes.get("YES_NO");
        validateValue(errors, "TV", emp.getHasTv(), yesNo);
        validateValue(errors, "Fridge", emp.getHasFridge(), yesNo);
        validateValue(errors, "Laptop", emp.getHasLaptop(), yesNo);
        validateValue(errors, "WiFi", emp.getHasWifi(), yesNo);
        validateValue(errors, "2 Wheeler", emp.getHas2wheeler(), yesNo);
        validateValue(errors, "4 Wheeler", emp.getHas4wheeler(), yesNo);
        validateValue(errors, "SSC Status", emp.getSscStatus(), yesNo);
        validateValue(errors, "Intermediate Status", emp.getIntermediateStatus(), yesNo);
        validateValue(errors, "Bachelor Degree", emp.getBachelorsDegree(), yesNo);
        validateValue(errors, "Master Degree", emp.getMastersDegree(), yesNo);
        validateValue(errors, "Aadhaar Verification", emp.getAadhaarVerification(), yesNo);
        validateValue(errors, "PAN Verification", emp.getPanVerification(), yesNo);
        validateValue(errors, "OSV", emp.getOsv(), yesNo);
        validateValue(errors, "Aadhar Seeding", emp.getAadharSeeding(), yesNo);
        validateValue(errors, "UAN Activation", emp.getUanActivation(), yesNo);
        validateValue(errors, "Past Experience", emp.getPastExperience(), yesNo);

        return errors;
    }

    private void validateValue(List<String> errors, String fieldName, String value, Set<String> allowedCodes) {
        if (allowedCodes == null || allowedCodes.isEmpty()) return;
        if (value == null || value.trim().isEmpty()) return; // optional fields allowed blank
        if (!allowedCodes.contains(value.trim())) {
            errors.add(fieldName + " '" + value.trim() + "' is not a valid master value");
        }
    }

    private String getCellStringValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield String.valueOf(cell.getNumericCellValue());
                } catch (Exception e) {
                    try {
                        yield cell.getStringCellValue();
                    } catch (Exception e2) {
                        yield "";
                    }
                }
            }
            default -> null;
        };
    }

    private void setCellValue(Row row, int col, String value) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
    }

    private LocalDate parseDate(String value, DateTimeFormatter formatter) {
        if (value == null || value.isEmpty()) return null;
        try {
            return LocalDate.parse(value, formatter);
        } catch (Exception e) {
            try {
                return LocalDate.parse(value);
            } catch (Exception e2) {
                return null;
            }
        }
    }

    private Integer parseInt(String value) {
        if (value == null || value.isEmpty()) return null;
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private java.math.BigDecimal parseDecimal(String value) {
        if (value == null || value.isEmpty()) return null;
        try {
            return new java.math.BigDecimal(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
