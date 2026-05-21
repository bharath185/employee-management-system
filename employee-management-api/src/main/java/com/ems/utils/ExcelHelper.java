package com.ems.utils;

import com.ems.model.Employee;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Component
public class ExcelHelper {

    private static final String[] HEADERS = {
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

    public byte[] exportToExcel(List<Employee> employees) {
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
            }

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

    public byte[] generateSampleExcel() {
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
            sampleRow.createCell(0).setCellValue("EMPL0001");
            sampleRow.createCell(1).setCellValue("Mr.");
            sampleRow.createCell(2).setCellValue("John");
            sampleRow.createCell(3).setCellValue("Doe");
            sampleRow.createCell(4).setCellValue("Male");
            sampleRow.createCell(5).setCellValue("Married");
            sampleRow.createCell(6).setCellValue("Robert Doe");
            sampleRow.createCell(7).setCellValue("Father");
            sampleRow.createCell(8).setCellValue("Salaried");
            sampleRow.createCell(11).setCellValue("01/01/2024");
            sampleRow.createCell(16).setCellValue("01/01/1990");
            sampleRow.createCell(20).setCellValue("9876543210");
            sampleRow.createCell(22).setCellValue("9876543210");
            sampleRow.createCell(26).setCellValue("Yes");
            sampleRow.createCell(27).setCellValue("Yes");
            sampleRow.createCell(32).setCellValue("A+");
            sampleRow.createCell(33).setCellValue("123456789012");
            sampleRow.createCell(34).setCellValue("ABCDE1234F");
            sampleRow.createCell(45).setCellValue("Live");
            sampleRow.createCell(73).setCellValue("Manager");

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

                employees.add(emp);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse Excel file", e);
        }
        return employees;
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
