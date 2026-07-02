package com.ems.repository;

import com.ems.model.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayslipRepository extends JpaRepository<Payslip, Long> {

    List<Payslip> findByEmployeeId(Long employeeId);

    List<Payslip> findByWageYearAndWageMonth(Integer year, Integer month);

    Optional<Payslip> findByEmployeeIdAndWageYearAndWageMonth(Long employeeId, Integer year, Integer month);

    boolean existsByEmployeeIdAndWageYearAndWageMonth(Long employeeId, Integer year, Integer month);

    @Query("SELECT COUNT(p) FROM Payslip p WHERE p.wageYear = :year AND p.wageMonth = :month")
    long countByWageYearAndWageMonth(@Param("year") Integer year, @Param("month") Integer month);

    @Query("SELECT COALESCE(SUM(p.grossSalary), 0) FROM Payslip p WHERE p.wageYear = :year AND p.wageMonth = :month")
    java.math.BigDecimal sumGrossByWageYearAndWageMonth(@Param("year") Integer year, @Param("month") Integer month);

    @Query("SELECT COALESCE(SUM(p.netPay), 0) FROM Payslip p WHERE p.wageYear = :year AND p.wageMonth = :month")
    java.math.BigDecimal sumNetByWageYearAndWageMonth(@Param("year") Integer year, @Param("month") Integer month);

    @Query("SELECT COALESCE(SUM(p.totalDeductions), 0) FROM Payslip p WHERE p.wageYear = :year AND p.wageMonth = :month")
    java.math.BigDecimal sumDeductionsByWageYearAndWageMonth(@Param("year") Integer year, @Param("month") Integer month);

    List<Payslip> findByWageYearAndWageMonthAndStatus(Integer year, Integer month, String status);
}
