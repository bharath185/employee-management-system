package com.ems.repository;

import com.ems.model.ReportTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportTemplateRepository extends JpaRepository<ReportTemplate, Long> {
    List<ReportTemplate> findByCategoryOrderByCreatedAtDesc(String category);
    List<ReportTemplate> findAllByOrderByCreatedAtDesc();
}
