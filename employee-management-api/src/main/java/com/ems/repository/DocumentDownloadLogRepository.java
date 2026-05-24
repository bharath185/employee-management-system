package com.ems.repository;

import com.ems.model.DocumentDownloadLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentDownloadLogRepository extends JpaRepository<DocumentDownloadLog, Long> {

    Page<DocumentDownloadLog> findByEmployeeId(Long employeeId, Pageable pageable);

    Page<DocumentDownloadLog> findByTemplateId(Long templateId, Pageable pageable);

    Page<DocumentDownloadLog> findByFinancialYear(String financialYear, Pageable pageable);

    Page<DocumentDownloadLog> findByEmployeeIdAndTemplateId(Long employeeId, Long templateId, Pageable pageable);

    Page<DocumentDownloadLog> findByEmployeeIdAndFinancialYear(Long employeeId, String financialYear, Pageable pageable);

    Page<DocumentDownloadLog> findByTemplateIdAndFinancialYear(Long templateId, String financialYear, Pageable pageable);

    Page<DocumentDownloadLog> findByEmployeeIdAndTemplateIdAndFinancialYear(
            Long employeeId, Long templateId, String financialYear, Pageable pageable);

    List<DocumentDownloadLog> findByEmployeeIdOrderByDownloadedAtDesc(Long employeeId);

    @Query("SELECT DISTINCT d.financialYear FROM DocumentDownloadLog d ORDER BY d.financialYear DESC")
    List<String> findDistinctFinancialYears();

    @Query("SELECT d.employeeId, COUNT(d) as cnt FROM DocumentDownloadLog d GROUP BY d.employeeId ORDER BY cnt DESC")
    List<Object[]> countByEmployeeId();

    @Query("SELECT d.templateId, COUNT(d) as cnt FROM DocumentDownloadLog d GROUP BY d.templateId ORDER BY cnt DESC")
    List<Object[]> countByTemplateId();

    @Query("SELECT d.financialYear, COUNT(d) as cnt FROM DocumentDownloadLog d GROUP BY d.financialYear ORDER BY cnt DESC")
    List<Object[]> countByFinancialYear();

    @Query("SELECT COUNT(d) FROM DocumentDownloadLog d WHERE d.employeeId = :employeeId")
    long countByEmployeeId(@Param("employeeId") Long employeeId);

    @Query("SELECT COUNT(d) FROM DocumentDownloadLog d WHERE d.templateId = :templateId")
    long countByTemplateId(@Param("templateId") Long templateId);

    @Query("SELECT COUNT(d) FROM DocumentDownloadLog d WHERE d.financialYear = :financialYear")
    long countByFinancialYear(@Param("financialYear") String financialYear);
}
