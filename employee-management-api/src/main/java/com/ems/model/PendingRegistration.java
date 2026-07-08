package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pending_registrations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "registration_code", length = 30, nullable = false, unique = true)
    private String registrationCode;

    @Column(name = "first_name", length = 40)
    private String firstName;

    @Column(name = "middle_name", length = 40)
    private String middleName;

    @Column(name = "surname", length = 40)
    private String surname;

    @Column(name = "mobile", length = 20, nullable = false)
    private String mobile;

    @Column(name = "email", length = 56)
    private String email;

    @Column(name = "dob")
    private LocalDate dob;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "languages", length = 500)
    private String languages;

    @Column(name = "prefix", length = 5)
    private String prefix;

    @Column(name = "marital_status", length = 20)
    private String maritalStatus;

    @Column(name = "present_address", length = 256)
    private String presentAddress;

    @Column(name = "permanent_address", length = 256)
    private String permanentAddress;

    @Column(name = "aadhar_number", length = 14)
    private String aadharNumber;

    @Column(name = "pan_number", length = 10)
    private String panNumber;

    @Column(name = "highest_qualification", length = 40)
    private String highestQualification;

    @Column(name = "designation", length = 40)
    private String designation;

    @Column(name = "doj")
    private LocalDate doj;

    @Column(name = "bank_name", length = 40)
    private String bankName;

    @Column(name = "account_number", length = 30)
    private String accountNumber;

    @Column(name = "ifsc_code", length = 11)
    private String ifscCode;

    @Column(name = "branch", length = 40)
    private String branch;

    @Column(name = "father_name", length = 20)
    private String fatherName;

    @Column(name = "father_phone", length = 15)
    private String fatherPhone;

    @Column(name = "mother_name", length = 20)
    private String motherName;

    @Column(name = "mother_phone", length = 15)
    private String motherPhone;

    @Column(name = "spouse_name", length = 20)
    private String spouseName;

    @Column(name = "spouse_phone", length = 15)
    private String spousePhone;

    @Column(name = "close_relative_name", length = 40)
    private String closeRelativeName;

    @Column(name = "close_relative_mobile", length = 15)
    private String closeRelativeMobile;

    @Column(name = "ration_card", length = 10)
    private String rationCard;

    @Column(name = "occupation_kin_sub", length = 40)
    private String occupationKinSub;

    @Column(name = "religion", length = 20)
    private String religion;

    @Column(name = "social_category", length = 30)
    private String socialCategory;

    @Column(name = "social_subcategory", length = 30)
    private String socialSubcategory;

    @Column(name = "level_of_education", length = 30)
    private String levelOfEducation;

    @Column(name = "year_of_passing", length = 10)
    private String yearOfPassing;

    @Column(name = "percentage_marks", length = 10)
    private String percentageMarks;

    @Column(name = "has_tv", length = 5)
    private String hasTv;

    @Column(name = "has_fridge", length = 5)
    private String hasFridge;

    @Column(name = "has_laptop", length = 5)
    private String hasLaptop;

    @Column(name = "has_wifi", length = 5)
    private String hasWifi;

    @Column(name = "has_2wheeler", length = 5)
    private String has2wheeler;

    @Column(name = "has_4wheeler", length = 5)
    private String has4wheeler;

    @Column(name = "blood_group", length = 10)
    private String bloodGroup;

    @Column(name = "ssc_status", length = 10)
    private String sscStatus;

    @Column(name = "intermediate_status", length = 10)
    private String intermediateStatus;

    @Column(name = "bachelors_degree", length = 10)
    private String bachelorsDegree;

    @Column(name = "masters_degree", length = 10)
    private String mastersDegree;

    @Column(name = "aadhaar_verification", length = 10)
    private String aadhaarVerification;

    @Column(name = "pan_verification", length = 10)
    private String panVerification;

    @Column(name = "osv", length = 10)
    private String osv;

    @Column(name = "remarks", length = 256)
    private String remarks;

    @Column(name = "past_experience", length = 10)
    private String pastExperience;

    @Column(name = "organization_name", length = 60)
    private String organizationName;

    @Column(name = "period_of_employment", length = 50)
    private String periodOfEmployment;

    @Column(name = "ref1_name", length = 40)
    private String ref1Name;

    @Column(name = "ref1_relationship", length = 20)
    private String ref1Relationship;

    @Column(name = "ref1_address", length = 256)
    private String ref1Address;

    @Column(name = "ref1_mobile", length = 15)
    private String ref1Mobile;

    @Column(name = "ref2_name", length = 40)
    private String ref2Name;

    @Column(name = "ref2_relationship", length = 20)
    private String ref2Relationship;

    @Column(name = "ref2_address", length = 256)
    private String ref2Address;

    @Column(name = "ref2_mobile", length = 15)
    private String ref2Mobile;

    @Column(name = "photo_path", length = 255)
    private String photoPath;

    @Column(name = "aadhar_doc_path", length = 255)
    private String aadharDocPath;

    @Column(name = "pan_doc_path", length = 255)
    private String panDocPath;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private RegistrationStatus status = RegistrationStatus.PENDING;

    @Column(name = "rejection_reason", length = 256)
    private String rejectionReason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approved_by", length = 20)
    private String approvedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
