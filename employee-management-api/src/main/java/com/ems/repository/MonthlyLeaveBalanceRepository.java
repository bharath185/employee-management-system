package com.ems.repository;

import com.ems.model.MonthlyLeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonthlyLeaveBalanceRepository extends JpaRepository<MonthlyLeaveBalance, Long> {

    List<MonthlyLeaveBalance> findByYearAndMonth(Integer year, Integer month);

    @Query("SELECT m FROM MonthlyLeaveBalance m JOIN FETCH m.employee e WHERE m.year = :year AND m.month = :month ORDER BY e.employeeCode ASC")
    List<MonthlyLeaveBalance> findByYearAndMonthWithEmployee(@Param("year") Integer year, @Param("month") Integer month);

    Optional<MonthlyLeaveBalance> findByEmployeeIdAndYearAndMonth(Long employeeId, Integer year, Integer month);

    @Query("SELECT m FROM MonthlyLeaveBalance m WHERE m.employee.id = :employeeId AND ((m.year = :year AND m.month < :month) OR (m.year < :year)) ORDER BY m.year DESC, m.month DESC")
    List<MonthlyLeaveBalance> findPreviousMonths(@Param("employeeId") Long employeeId, @Param("year") Integer year, @Param("month") Integer month);
}
