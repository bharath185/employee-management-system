package com.ems.repository;

import com.ems.model.DocumentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
public interface DocumentTemplateRepository extends JpaRepository<DocumentTemplate, Long> {

    List<DocumentTemplate> findByIsActiveTrueOrderByTemplateName();

    List<DocumentTemplate> findByTemplateTypeAndIsActiveTrue(String templateType);

    List<DocumentTemplate> findByIsActiveTrueAndTemplateType(String templateType);

    List<DocumentTemplate> findByTemplateType(String templateType);

    Page<DocumentTemplate> findByTemplateType(String templateType, Pageable pageable);

    Page<DocumentTemplate> findByIsActive(Boolean active, Pageable pageable);

    Page<DocumentTemplate> findByTemplateTypeAndIsActive(String templateType, Boolean active, Pageable pageable);
}
