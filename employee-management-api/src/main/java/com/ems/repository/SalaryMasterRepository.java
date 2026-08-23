package com.ems.repository;

import com.ems.model.SalaryMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryMasterRepository extends JpaRepository<SalaryMaster, Long> {
    @Query("SELECT sm FROM SalaryMaster sm JOIN FETCH sm.employee e WHERE sm.employee.id = :employeeId")
    Optional<SalaryMaster> findByEmployeeId(Long employeeId);

    @Query("SELECT sm FROM SalaryMaster sm JOIN FETCH sm.employee e WHERE e.isDeleted = false ORDER BY e.employeeCode ASC")
    List<SalaryMaster> findAllByOrderByEmployeeAsc();

    boolean existsByEmployeeId(Long employeeId);
}
