package com.ems.dto;

import com.ems.model.Company;
import com.fasterxml.jackson.annotation.JsonFormat;
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
public class CompanyDTO {

    private Long id;
    private String companyName;
    private String address;
    private String phone;
    private String email;
    private String website;
    private String registrationNumber;
    private String gstNumber;
    private String panNumber;
    private String tanNumber;
    private String cinNumber;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate incorporatedDate;

    private String logoPath;
    private String authorizedSignatory;
    private String signaturePath;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    private String createdBy;
    private String updatedBy;

    public static CompanyDTO fromEntity(Company company) {
        if (company == null) return null;
        return CompanyDTO.builder()
            .id(company.getId())
            .companyName(company.getCompanyName())
            .address(company.getAddress())
            .phone(company.getPhone())
            .email(company.getEmail())
            .website(company.getWebsite())
            .registrationNumber(company.getRegistrationNumber())
            .gstNumber(company.getGstNumber())
            .panNumber(company.getPanNumber())
            .tanNumber(company.getTanNumber())
            .cinNumber(company.getCinNumber())
            .incorporatedDate(company.getIncorporatedDate())
            .logoPath(company.getLogoPath())
            .authorizedSignatory(company.getAuthorizedSignatory())
            .signaturePath(company.getSignaturePath())
            .createdAt(company.getCreatedAt())
            .updatedAt(company.getUpdatedAt())
            .createdBy(company.getCreatedBy())
            .updatedBy(company.getUpdatedBy())
            .build();
    }

    public Company toEntity() {
        Company company = new Company();
        company.setCompanyName(this.companyName);
        company.setAddress(this.address);
        company.setPhone(this.phone);
        company.setEmail(this.email);
        company.setWebsite(this.website);
        company.setRegistrationNumber(this.registrationNumber);
        company.setGstNumber(this.gstNumber);
        company.setPanNumber(this.panNumber);
        company.setTanNumber(this.tanNumber);
        company.setCinNumber(this.cinNumber);
        company.setIncorporatedDate(this.incorporatedDate);
        company.setAuthorizedSignatory(this.authorizedSignatory);
        return company;
    }
}
