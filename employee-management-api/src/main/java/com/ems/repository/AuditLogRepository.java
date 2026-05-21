package com.ems.repository;

import com.ems.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByEmployeeIdOrderByChangedAtDesc(Long employeeId);

    Page<AuditLog> findAllByOrderByChangedAtDesc(Pageable pageable);

    Page<AuditLog> findByEmployeeIdOrderByChangedAtDesc(Long employeeId, Pageable pageable);
}
