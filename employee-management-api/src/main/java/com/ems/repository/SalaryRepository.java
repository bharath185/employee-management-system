package com.ems.repository;

import com.ems.model.Salary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryRepository extends JpaRepository<Salary, Long> {

    Page<Salary> findByWageYearAndWageMonth(Integer year, Integer month, Pageable pageable);

    List<Salary> findByWageYearAndWageMonth(Integer year, Integer month);

    Optional<Salary> findByEmployeeIdAndWageYearAndWageMonth(Long employeeId, Integer year, Integer month);

    boolean existsByEmployeeIdAndWageYearAndWageMonth(Long employeeId, Integer year, Integer month);

    @Query("SELECT s FROM Salary s WHERE s.employee.id = :employeeId ORDER BY s.wageYear DESC, s.wageMonth DESC")
    List<Salary> findByEmployeeId(@Param("employeeId") Long employeeId);

    @Query("SELECT DISTINCT s.wageYear FROM Salary s ORDER BY s.wageYear DESC")
    List<Integer> findDistinctWageYears();

    @Query("SELECT DISTINCT s.wageMonth FROM Salary s WHERE s.wageYear = :year ORDER BY s.wageMonth DESC")
    List<Integer> findDistinctWageMonthsByYear(@Param("year") Integer year);

    @Query("SELECT COUNT(s) FROM Salary s WHERE s.wageYear = :year AND s.wageMonth = :month")
    long countByWagePeriod(@Param("year") Integer year, @Param("month") Integer month);
}
