package com.ems.repository;

import com.ems.model.EmployeeDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeDocumentRepository extends JpaRepository<EmployeeDocument, Long> {
    List<EmployeeDocument> findByEmployeeIdOrderByUploadedAtDesc(Long employeeId);
    Optional<EmployeeDocument> findByEmployeeIdAndDocumentType(Long employeeId, String documentType);
    boolean existsByEmployeeIdAndDocumentType(Long employeeId, String documentType);
    void deleteByEmployeeId(Long employeeId);
}
