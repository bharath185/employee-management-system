package com.ems.repository;

import com.ems.model.CompanyDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompanyDocumentRepository extends JpaRepository<CompanyDocument, Long> {

    List<CompanyDocument> findByCompanyIdOrderByUploadedAtDesc(Long companyId);

    long countByCompanyId(Long companyId);
}
