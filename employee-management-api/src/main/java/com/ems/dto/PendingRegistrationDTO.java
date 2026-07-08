package com.ems.dto;

import com.ems.model.PendingRegistration;
import com.ems.model.RegistrationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingRegistrationDTO {
    private Long id;
    private String registrationCode;
    private String firstName;
    private String middleName;
    private String surname;
    private String mobile;
    private String email;
    private LocalDate dob;
    private String gender;
    private String prefix;
    private String maritalStatus;
    private String presentAddress;
    private String permanentAddress;
    private String aadharNumber;
    private String panNumber;
    private String highestQualification;
    private String designation;
    private String doj;
    private String bankName;
    private String accountNumber;
    private String ifscCode;
    private String branch;
    private String fatherName;
    private String fatherPhone;
    private String motherName;
    private String motherPhone;
    private String spouseName;
    private String spousePhone;
    private String closeRelativeName;
    private String closeRelativeMobile;
    private String rationCard;
    private String occupationKinSub;
    private String religion;
    private String socialCategory;
    private String socialSubcategory;
    private String levelOfEducation;
    private String yearOfPassing;
    private String percentageMarks;
    private String hasTv;
    private String hasFridge;
    private String hasLaptop;
    private String hasWifi;
    private String has2wheeler;
    private String has4wheeler;
    private String bloodGroup;
    private String sscStatus;
    private String intermediateStatus;
    private String bachelorsDegree;
    private String mastersDegree;
    private String aadhaarVerification;
    private String panVerification;
    private String osv;
    private String remarks;
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
    private String photoUrl;
    private String aadharDocUrl;
    private String panDocUrl;
    private String status;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private String approvedBy;
    private String languages;

    public static PendingRegistrationDTO fromEntity(PendingRegistration entity) {
        PendingRegistrationDTOBuilder builder = PendingRegistrationDTO.builder()
            .id(entity.getId())
            .registrationCode(entity.getRegistrationCode())
            .firstName(entity.getFirstName())
            .middleName(entity.getMiddleName())
            .surname(entity.getSurname())
            .mobile(entity.getMobile())
            .email(entity.getEmail())
            .dob(entity.getDob())
            .gender(entity.getGender())
            .prefix(entity.getPrefix())
            .maritalStatus(entity.getMaritalStatus())
            .presentAddress(entity.getPresentAddress())
            .permanentAddress(entity.getPermanentAddress())
            .aadharNumber(entity.getAadharNumber())
            .panNumber(entity.getPanNumber())
            .highestQualification(entity.getHighestQualification())
            .designation(entity.getDesignation())
            .doj(entity.getDoj() != null ? entity.getDoj().toString() : null)
            .bankName(entity.getBankName())
            .accountNumber(entity.getAccountNumber())
            .ifscCode(entity.getIfscCode())
            .branch(entity.getBranch())
            .fatherName(entity.getFatherName())
            .fatherPhone(entity.getFatherPhone())
            .motherName(entity.getMotherName())
            .motherPhone(entity.getMotherPhone())
            .spouseName(entity.getSpouseName())
            .spousePhone(entity.getSpousePhone())
            .closeRelativeName(entity.getCloseRelativeName())
            .closeRelativeMobile(entity.getCloseRelativeMobile())
            .rationCard(entity.getRationCard())
            .occupationKinSub(entity.getOccupationKinSub())
            .religion(entity.getReligion())
            .socialCategory(entity.getSocialCategory())
            .socialSubcategory(entity.getSocialSubcategory())
            .levelOfEducation(entity.getLevelOfEducation())
            .yearOfPassing(entity.getYearOfPassing())
            .percentageMarks(entity.getPercentageMarks())
            .hasTv(entity.getHasTv())
            .hasFridge(entity.getHasFridge())
            .hasLaptop(entity.getHasLaptop())
            .hasWifi(entity.getHasWifi())
            .has2wheeler(entity.getHas2wheeler())
            .has4wheeler(entity.getHas4wheeler())
            .bloodGroup(entity.getBloodGroup())
            .sscStatus(entity.getSscStatus())
            .intermediateStatus(entity.getIntermediateStatus())
            .bachelorsDegree(entity.getBachelorsDegree())
            .mastersDegree(entity.getMastersDegree())
            .aadhaarVerification(entity.getAadhaarVerification())
            .panVerification(entity.getPanVerification())
            .osv(entity.getOsv())
            .remarks(entity.getRemarks())
            .pastExperience(entity.getPastExperience())
            .organizationName(entity.getOrganizationName())
            .periodOfEmployment(entity.getPeriodOfEmployment())
            .ref1Name(entity.getRef1Name())
            .ref1Relationship(entity.getRef1Relationship())
            .ref1Address(entity.getRef1Address())
            .ref1Mobile(entity.getRef1Mobile())
            .ref2Name(entity.getRef2Name())
            .ref2Relationship(entity.getRef2Relationship())
            .ref2Address(entity.getRef2Address())
            .ref2Mobile(entity.getRef2Mobile())
            .photoUrl(entity.getPhotoPath())
            .aadharDocUrl(entity.getAadharDocPath())
            .panDocUrl(entity.getPanDocPath())
            .status(entity.getStatus() != null ? entity.getStatus().name() : "PENDING")
            .rejectionReason(entity.getRejectionReason())
            .createdAt(entity.getCreatedAt())
            .approvedAt(entity.getApprovedAt())
            .approvedBy(entity.getApprovedBy())
            .languages(entity.getLanguages());
        return builder.build();
    }
}
