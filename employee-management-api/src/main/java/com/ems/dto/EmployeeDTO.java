package com.ems.dto;

import com.ems.model.Employee;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Data Transfer Object for Employee with all 80 fields.
 * Maps bidirectionally with the Employee entity.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDTO {

    private Long id;
    private String employeeCode;
    private String prefix;
    private String firstName;
    private String surname;
    private String gender;
    private String maritalStatus;
    private String fatherHusbandName;

    @JsonProperty("fMH")
    private String fMH;
    private String occupationKin;
    private String occupationKinSub;
    private String rationCard;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate doj;
    private String highestQualification;
    private String levelOfEducation;
    private Integer yearOfPassing;
    private BigDecimal percentageMarks;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dob;
    private Integer age;
    private String ageBracket;
    private String presentAddress;
    private String permanentAddress;
    private String email;
    private String mobile;
    private String closeRelativeName;
    private String closeRelativeMobile;
    private String religion;
    private String socialCategory;
    private String socialSubcategory;
    private String hasTv;
    private String hasFridge;
    private String hasLaptop;
    private String hasWifi;
    private String has2wheeler;
    private String has4wheeler;
    private String bloodGroup;
    private String aadharNumber;
    private String panNumber;
    private String sscStatus;
    private String intermediateStatus;
    private String bachelorsDegree;
    private String mastersDegree;
    private String aadhaarVerification;
    private String panVerification;
    private String osv;
    private String remarks;
    private String bankName;
    private String accountNumber;
    private String ifscCode;
    private String branch;
    private String employeeStatus;
    private String processAssigned;
    private String esicNo;
    private String aadharSeeding;
    private String uanNo;
    private String pfNo;
    private String uanActivation;
    private String languagesCanSpeak;
    private String fatherName;
    private String fatherPhone;
    private String motherName;
    private String motherPhone;
    private String spouseName;
    private String spousePhone;
    private String pastExperience;
    private String organizationName;
    private String periodOfEmployment;
    private String ref1Name;
    private String ref1Relationship;
    private String ref1Address;
    private String ref1Mobile;
    private String ref2Name;
    private String ref2Relationship;
    private String ref2Address;
    private String ref2Mobile;
    private String designation;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate doe;
    private String deletionMonth;
    private String exitType;
    private String exitReason;
    private String photoPath;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // ========== MAPPING METHODS ==========

    public static EmployeeDTO fromEntity(Employee emp) {
        if (emp == null) return null;
        return EmployeeDTO.builder()
            .id(emp.getId())
            .employeeCode(emp.getEmployeeCode())
            .prefix(emp.getPrefix())
            .firstName(emp.getFirstName())
            .surname(emp.getSurname())
            .gender(emp.getGender())
            .maritalStatus(emp.getMaritalStatus())
            .fatherHusbandName(emp.getFatherHusbandName())
            .fMH(emp.getFMH())
            .occupationKin(emp.getOccupationKin())
            .occupationKinSub(emp.getOccupationKinSub())
            .rationCard(emp.getRationCard())
            .doj(emp.getDoj())
            .highestQualification(emp.getHighestQualification())
            .levelOfEducation(emp.getLevelOfEducation())
            .yearOfPassing(emp.getYearOfPassing())
            .percentageMarks(emp.getPercentageMarks())
            .dob(emp.getDob())
            .age(emp.getAge())
            .ageBracket(emp.getAgeBracket())
            .presentAddress(emp.getPresentAddress())
            .permanentAddress(emp.getPermanentAddress())
            .email(emp.getEmail())
            .mobile(emp.getMobile())
            .closeRelativeName(emp.getCloseRelativeName())
            .closeRelativeMobile(emp.getCloseRelativeMobile())
            .religion(emp.getReligion())
            .socialCategory(emp.getSocialCategory())
            .socialSubcategory(emp.getSocialSubcategory())
            .hasTv(emp.getHasTv())
            .hasFridge(emp.getHasFridge())
            .hasLaptop(emp.getHasLaptop())
            .hasWifi(emp.getHasWifi())
            .has2wheeler(emp.getHas2wheeler())
            .has4wheeler(emp.getHas4wheeler())
            .bloodGroup(emp.getBloodGroup())
            .aadharNumber(emp.getAadharNumber())
            .panNumber(emp.getPanNumber())
            .sscStatus(emp.getSscStatus())
            .intermediateStatus(emp.getIntermediateStatus())
            .bachelorsDegree(emp.getBachelorsDegree())
            .mastersDegree(emp.getMastersDegree())
            .aadhaarVerification(emp.getAadhaarVerification())
            .panVerification(emp.getPanVerification())
            .osv(emp.getOsv())
            .remarks(emp.getRemarks())
            .bankName(emp.getBankName())
            .accountNumber(emp.getAccountNumber())
            .ifscCode(emp.getIfscCode())
            .branch(emp.getBranch())
            .employeeStatus(emp.getEmployeeStatus())
            .processAssigned(emp.getProcessAssigned())
            .esicNo(emp.getEsicNo())
            .aadharSeeding(emp.getAadharSeeding())
            .uanNo(emp.getUanNo())
            .pfNo(emp.getPfNo())
            .uanActivation(emp.getUanActivation())
            .languagesCanSpeak(emp.getLanguagesCanSpeak())
            .fatherName(emp.getFatherName())
            .fatherPhone(emp.getFatherPhone())
            .motherName(emp.getMotherName())
            .motherPhone(emp.getMotherPhone())
            .spouseName(emp.getSpouseName())
            .spousePhone(emp.getSpousePhone())
            .pastExperience(emp.getPastExperience())
            .organizationName(emp.getOrganizationName())
            .periodOfEmployment(emp.getPeriodOfEmployment())
            .ref1Name(emp.getRef1Name())
            .ref1Relationship(emp.getRef1Relationship())
            .ref1Address(emp.getRef1Address())
            .ref1Mobile(emp.getRef1Mobile())
            .ref2Name(emp.getRef2Name())
            .ref2Relationship(emp.getRef2Relationship())
            .ref2Address(emp.getRef2Address())
            .ref2Mobile(emp.getRef2Mobile())
            .designation(emp.getDesignation())
            .doe(emp.getDoe())
            .deletionMonth(emp.getDeletionMonth())
            .exitType(emp.getExitType())
            .exitReason(emp.getExitReason())
            .photoPath(emp.getPhotoPath())
            .createdAt(emp.getCreatedAt())
            .updatedAt(emp.getUpdatedAt())
            .build();
    }

    public Employee toEntity() {
        Employee emp = new Employee();
        emp.setEmployeeCode(this.employeeCode);
        emp.setPrefix(this.prefix);
        emp.setFirstName(this.firstName);
        emp.setSurname(this.surname);
        emp.setGender(this.gender);
        emp.setMaritalStatus(this.maritalStatus);
        emp.setFatherHusbandName(this.fatherHusbandName);
        emp.setFMH(this.fMH);
        emp.setOccupationKin(this.occupationKin);
        emp.setOccupationKinSub(this.occupationKinSub);
        emp.setRationCard(this.rationCard);
        emp.setDoj(this.doj);
        emp.setHighestQualification(this.highestQualification);
        emp.setLevelOfEducation(this.levelOfEducation);
        emp.setYearOfPassing(this.yearOfPassing);
        emp.setPercentageMarks(this.percentageMarks);
        emp.setDob(this.dob);
        emp.setPresentAddress(this.presentAddress);
        emp.setPermanentAddress(this.permanentAddress);
        emp.setEmail(this.email);
        emp.setMobile(this.mobile);
        emp.setCloseRelativeName(this.closeRelativeName);
        emp.setCloseRelativeMobile(this.closeRelativeMobile);
        emp.setReligion(this.religion);
        emp.setSocialCategory(this.socialCategory);
        emp.setSocialSubcategory(this.socialSubcategory);
        emp.setHasTv(this.hasTv);
        emp.setHasFridge(this.hasFridge);
        emp.setHasLaptop(this.hasLaptop);
        emp.setHasWifi(this.hasWifi);
        emp.setHas2wheeler(this.has2wheeler);
        emp.setHas4wheeler(this.has4wheeler);
        emp.setBloodGroup(this.bloodGroup);
        emp.setAadharNumber(this.aadharNumber);
        emp.setPanNumber(this.panNumber);
        emp.setSscStatus(this.sscStatus);
        emp.setIntermediateStatus(this.intermediateStatus);
        emp.setBachelorsDegree(this.bachelorsDegree);
        emp.setMastersDegree(this.mastersDegree);
        emp.setAadhaarVerification(this.aadhaarVerification);
        emp.setPanVerification(this.panVerification);
        emp.setOsv(this.osv);
        emp.setRemarks(this.remarks);
        emp.setBankName(this.bankName);
        emp.setAccountNumber(this.accountNumber);
        emp.setIfscCode(this.ifscCode);
        emp.setBranch(this.branch);
        emp.setEmployeeStatus(this.employeeStatus);
        emp.setProcessAssigned(this.processAssigned);
        emp.setEsicNo(this.esicNo);
        emp.setAadharSeeding(this.aadharSeeding);
        emp.setUanNo(this.uanNo);
        emp.setPfNo(this.pfNo);
        emp.setUanActivation(this.uanActivation);
        emp.setLanguagesCanSpeak(this.languagesCanSpeak);
        emp.setFatherName(this.fatherName);
        emp.setFatherPhone(this.fatherPhone);
        emp.setMotherName(this.motherName);
        emp.setMotherPhone(this.motherPhone);
        emp.setSpouseName(this.spouseName);
        emp.setSpousePhone(this.spousePhone);
        emp.setPastExperience(this.pastExperience);
        emp.setOrganizationName(this.organizationName);
        emp.setPeriodOfEmployment(this.periodOfEmployment);
        emp.setRef1Name(this.ref1Name);
        emp.setRef1Relationship(this.ref1Relationship);
        emp.setRef1Address(this.ref1Address);
        emp.setRef1Mobile(this.ref1Mobile);
        emp.setRef2Name(this.ref2Name);
        emp.setRef2Relationship(this.ref2Relationship);
        emp.setRef2Address(this.ref2Address);
        emp.setRef2Mobile(this.ref2Mobile);
        emp.setDesignation(this.designation);
        emp.setDoe(this.doe);
        emp.setDeletionMonth(this.deletionMonth);
        emp.setExitType(this.exitType);
        emp.setExitReason(this.exitReason);
        emp.setPhotoPath(this.photoPath);
        return emp;
    }
}
