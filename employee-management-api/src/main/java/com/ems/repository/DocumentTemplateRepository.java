package com.ems.repository;

import com.ems.model.DocumentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentTemplateRepository extends JpaRepository<DocumentTemplate, Long> {

    List<DocumentTemplate> findByIsActiveTrueOrderByTemplateName();

    List<DocumentTemplate> findByTemplateTypeAndIsActiveTrue(String templateType);

    List<DocumentTemplate> findByIsActiveTrueAndTemplateType(String templateType);

    List<DocumentTemplate> findByTemplateType(String templateType);
}
