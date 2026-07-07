package com.ems.repository;

import com.ems.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository
        extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    Optional<Employee> findByEmployeeCode(String employeeCode);

    boolean existsByEmployeeCode(String employeeCode);

    @Query(value = "SELECT COUNT(*) > 0 FROM employees WHERE employee_code = ?1", nativeQuery = true)
    boolean existsByEmployeeCodeIncludingDeleted(String employeeCode);

    @Query(value = "SELECT MAX(employee_code) FROM employees WHERE employee_code LIKE 'PARI%'", nativeQuery = true)
    String findMaxEmployeeCode();

    @Query(value = "SELECT id FROM employees WHERE employee_code = ?1 AND is_deleted = false", nativeQuery = true)
    Long findActiveEmployeeIdByCode(String employeeCode);

    @Query("SELECT DISTINCT e.department FROM Employee e WHERE e.department IS NOT NULL AND e.department <> '' AND e.isDeleted = false ORDER BY e.department")
    List<String> findDistinctDepartments();

    List<Employee> findByDepartmentAndIsDeletedFalse(String department, org.springframework.data.domain.Pageable pageable);

    long countByDepartmentAndIsDeletedFalse(String department);

    @Query(value = "SELECT COUNT(*) FROM employees", nativeQuery = true)
    long countIncludingDeleted();

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.isDeleted = false")
    long countActive();

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.employeeStatus = 'LIVE' AND e.isDeleted = false")
    long countLive();

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.gender = :gender AND e.isDeleted = false")
    long countByGender(String gender);

    @Query("SELECT e FROM Employee e WHERE e.employeeStatus = 'LIVE' AND e.isDeleted = false")
    List<Employee> findAllLiveEmployees();
}
