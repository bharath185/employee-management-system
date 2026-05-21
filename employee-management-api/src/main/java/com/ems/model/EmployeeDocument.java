package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "employee_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "document_type", length = 50, nullable = false)
    private String documentType;

    @Column(name = "file_name", length = 200, nullable = false)
    private String fileName;

    @Column(name = "original_name", length = 200, nullable = false)
    private String originalName;

    @Column(name = "file_path", length = 500, nullable = false)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "uploaded_by", length = 50)
    private String uploadedBy;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
}
