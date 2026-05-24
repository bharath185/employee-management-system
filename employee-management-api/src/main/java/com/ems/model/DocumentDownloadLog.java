package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_download_logs", indexes = {
    @Index(name = "idx_download_employee", columnList = "employee_id"),
    @Index(name = "idx_download_template", columnList = "template_id"),
    @Index(name = "idx_download_financial_year", columnList = "financial_year")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDownloadLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Column(name = "financial_year", length = 20, nullable = false)
    private String financialYear;

    @Column(name = "downloaded_at", nullable = false)
    private LocalDateTime downloadedAt;

    @Column(name = "downloaded_by", length = 50)
    private String downloadedBy;

    @PrePersist
    protected void onCreate() {
        downloadedAt = LocalDateTime.now();
    }
}
