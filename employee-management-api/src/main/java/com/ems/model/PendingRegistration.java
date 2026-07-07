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
