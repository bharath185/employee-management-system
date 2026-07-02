package com.ems.repository;

import com.ems.model.SalaryMasterHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalaryMasterHistoryRepository extends JpaRepository<SalaryMasterHistory, Long> {
    List<SalaryMasterHistory> findBySalaryMasterIdOrderByChangedAtDesc(Long salaryMasterId);
    List<SalaryMasterHistory> findByEmployeeIdOrderByChangedAtDesc(Long employeeId);
}
