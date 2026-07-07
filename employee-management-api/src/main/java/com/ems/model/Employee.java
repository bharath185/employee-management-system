package com.ems.model;

import com.ems.dto.EmployeeLanguageDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import org.hibernate.annotations.SQLRestriction;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employees", indexes = {
    @Index(name = "idx_employee_code", columnList = "employee_code"),
    @Index(name = "idx_gender", columnList = "gender"),
    @Index(name = "idx_employee_status", columnList = "employee_status"),
    @Index(name = "idx_designation", columnList = "designation"),
    @Index(name = "idx_is_deleted", columnList = "is_deleted")
})
@SQLRestriction("is_deleted = false")
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ========== PERSONAL INFO GROUP (25 fields) ==========
    @Column(name = "employee_code", length = 20, nullable = false, unique = true)
    private String employeeCode;

    @Column(name = "prefix", length = 5)
    private String prefix;

    @Column(name = "first_name", length = 40)
    private String firstName;

    @Column(name = "surname", length = 40)
    private String surname;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "marital_status", length = 10)
    private String maritalStatus;

    @Column(name = "father_husband_name", length = 40)
    private String fatherHusbandName;

    @Column(name = "f_m_h", length = 10)
    private String fMH;

    @Column(name = "occupation_kin", length = 30)
    private String occupationKin;

    @Column(name = "occupation_kin_sub", length = 40)
    private String occupationKinSub;

    @Column(name = "ration_card", length = 5)
    private String rationCard;

    @Column(name = "doj")
    private LocalDate doj;

    @Column(name = "highest_qualification", length = 40)
    private String highestQualification;

    @Column(name = "level_of_education", length = 20)
    private String levelOfEducation;

    @Column(name = "year_of_passing")
    private Integer yearOfPassing;

    @Column(name = "percentage_marks", precision = 5, scale = 2)
    private BigDecimal percentageMarks;

    @Column(name = "dob")
    private LocalDate dob;

    @Column(name = "age")
    private Integer age;

    @Column(name = "age_bracket", length = 15)
    private String ageBracket;

    @Column(name = "present_address", length = 256)
    private String presentAddress;

    @Column(name = "permanent_address", length = 256)
    private String permanentAddress;

    @Column(name = "email", length = 56)
    private String email;
    @Column(name = "mobile", length = 20, nullable = false)

    private String mobile;

    @Column(name = "close_relative_name", length = 40)
    private String closeRelativeName;

    @Column(name = "close_relative_mobile", length = 10)
    private String closeRelativeMobile;

    // ========== DEMOGRAPHICS GROUP (3 fields) ==========
    @Column(name = "religion", length = 20)
    private String religion;

    @Column(name = "social_category", length = 20)
    private String socialCategory;

    @Column(name = "social_subcategory", length = 20)
    private String socialSubcategory;

    // ========== ASSETS GROUP (6 fields) ==========
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

    // ========== IDENTITY GROUP (3 fields) ==========
    @Column(name = "blood_group", length = 5)
    private String bloodGroup;

    @Column(name = "aadhar_number", length = 14)
    private String aadharNumber;

    @Column(name = "pan_number", length = 10)
    private String panNumber;

    // ========== EDUCATION GROUP (8 fields) ==========
    @Column(name = "ssc_status", length = 5)
    private String sscStatus;

    @Column(name = "intermediate_status", length = 5)
    private String intermediateStatus;

    @Column(name = "bachelors_degree", length = 5)
    private String bachelorsDegree;

    @Column(name = "masters_degree", length = 5)
    private String mastersDegree;

    @Column(name = "aadhaar_verification", length = 5)
    private String aadhaarVerification;

    @Column(name = "pan_verification", length = 5)
    private String panVerification;

    @Column(name = "osv", length = 5)
    private String osv;

    @Column(name = "remarks", length = 140)
    private String remarks;

    // ========== BANK GROUP (4 fields) ==========
    @Column(name = "bank_name", length = 56)
    private String bankName;

    @Column(name = "account_number", length = 30)
    private String accountNumber;

    @Column(name = "ifsc_code", length = 11)
    private String ifscCode;

    @Column(name = "branch", length = 40)
    private String branch;

    // ========== EMPLOYMENT GROUP (8 fields) ==========
    @Column(name = "employee_status", length = 15)
    private String employeeStatus;

    @Column(name = "process_assigned", length = 56)
    private String processAssigned;

    @Column(name = "department", length = 56)
    private String department;

    @Column(name = "esic_no", length = 10)
    private String esicNo;

    @Column(name = "aadhar_seeding", length = 5)
    private String aadharSeeding;

    @Column(name = "uan_no", length = 12)
    private String uanNo;

    @Column(name = "pf_no", length = 22)
    private String pfNo;

    @Column(name = "uan_activation", length = 5)
    private String uanActivation;

    @Column(name = "languages_can_speak", length = 100)
    private String languagesCanSpeak;

    @Transient
    private List<EmployeeLanguageDTO> importLanguages;

    // ========== FAMILY GROUP (6 fields) ==========
    @Column(name = "father_name", length = 20)
    private String fatherName;

    @Column(name = "father_phone", length = 10)
    private String fatherPhone;

    @Column(name = "mother_name", length = 20)
    private String motherName;

    @Column(name = "mother_phone", length = 10)
    private String motherPhone;

    @Column(name = "spouse_name", length = 20)
    private String spouseName;

    @Column(name = "spouse_phone", length = 10)
    private String spousePhone;

    // ========== EXPERIENCE GROUP (3 fields) ==========
    @Column(name = "past_experience", length = 5)
    private String pastExperience;

    @Column(name = "organization_name", length = 56)
    private String organizationName;

    @Column(name = "period_of_employment", length = 50)
    private String periodOfEmployment;

    // ========== REFERENCES GROUP (8 fields) ==========
    @Column(name = "ref1_name", length = 20)
    private String ref1Name;

    @Column(name = "ref1_relationship", length = 20)
    private String ref1Relationship;

    @Column(name = "ref1_address", length = 256)
    private String ref1Address;

    @Column(name = "ref1_mobile", length = 10)
    private String ref1Mobile;

    @Column(name = "ref2_name", length = 20)
    private String ref2Name;

    @Column(name = "ref2_relationship", length = 20)
    private String ref2Relationship;

    @Column(name = "ref2_address", length = 256)
    private String ref2Address;

    @Column(name = "ref2_mobile", length = 10)
    private String ref2Mobile;

    // ========== OFFICIAL/EXIT GROUP (6 fields) ==========
    @Column(name = "designation", length = 40)
    private String designation;

    @Column(name = "doe")
    private LocalDate doe;

    @Column(name = "deletion_month", length = 10)
    private String deletionMonth;

    @Column(name = "exit_type", length = 30)
    private String exitType;

    @Column(name = "exit_reason", length = 256)
    private String exitReason;

    @Column(name = "photo_path", length = 255)
    private String photoPath;

    // ========== AUDIT FIELDS ==========
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", length = 20, updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by", length = 20)
    private String updatedBy;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // ========== LIFECYCLE CALLBACKS ==========
    @PrePersist
    @PreUpdate
    public void computeDerivedFields() {
        // Compute age from DOB
        if (this.dob != null) {
            LocalDate today = LocalDate.now();
            this.age = today.getYear() - this.dob.getYear();
            if (today.getDayOfYear() < this.dob.getDayOfYear()) {
                this.age--;
            }
            // Compute age bracket
            if (this.age <= 25) this.ageBracket = "25 & Below";
            else if (this.age <= 30) this.ageBracket = "26 to 30";
            else if (this.age <= 35) this.ageBracket = "31 to 35";
            else if (this.age <= 40) this.ageBracket = "36 to 40";
            else if (this.age <= 50) this.ageBracket = "41 to 50";
            else this.ageBracket = "51 & Above";
        }
    }

    public String getFullName() {
        return (prefix != null ? prefix + " " : "") + firstName + " " + surname;
    }
}
