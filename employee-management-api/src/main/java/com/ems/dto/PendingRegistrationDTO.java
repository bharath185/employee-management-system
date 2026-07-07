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
