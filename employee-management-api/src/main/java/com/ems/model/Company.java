package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "company")
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", length = 200, nullable = false)
    private String companyName;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "website", length = 200)
    private String website;

    @Column(name = "registration_number", length = 100)
    private String registrationNumber;

    @Column(name = "gst_number", length = 50)
    private String gstNumber;

    @Column(name = "pan_number", length = 50)
    private String panNumber;

    @Column(name = "tan_number", length = 50)
    private String tanNumber;

    @Column(name = "cin_number", length = 50)
    private String cinNumber;

    @Column(name = "incorporated_date")
    private LocalDate incorporatedDate;

    @Column(name = "logo_path", length = 255)
    private String logoPath;

    @Column(name = "authorized_signatory", length = 100)
    private String authorizedSignatory;

    @Column(name = "signature_path", length = 255)
    private String signaturePath;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", length = 50, updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by", length = 50)
    private String updatedBy;
}
