package com.ems.repository;

import com.ems.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeRepository
        extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    Optional<Employee> findByEmployeeCode(String employeeCode);

    boolean existsByEmployeeCode(String employeeCode);

    @Query("SELECT MAX(e.employeeCode) FROM Employee e WHERE e.employeeCode LIKE 'EMP%'")
    String findMaxEmployeeCode();

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.isDeleted = false")
    long countActive();

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.employeeStatus = 'LIVE' AND e.isDeleted = false")
    long countLive();

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.gender = :gender AND e.isDeleted = false")
    long countByGender(String gender);
}
