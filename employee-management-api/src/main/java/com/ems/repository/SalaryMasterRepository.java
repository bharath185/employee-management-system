package com.ems.repository;

import com.ems.model.SalaryMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryMasterRepository extends JpaRepository<SalaryMaster, Long> {
    Optional<SalaryMaster> findByEmployeeId(Long employeeId);
    List<SalaryMaster> findAllByOrderByEmployeeAsc();
    boolean existsByEmployeeId(Long employeeId);
}
