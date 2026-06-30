package com.ems.repository;

import com.ems.model.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {

    List<LeaveBalance> findByEmployeeIdAndYear(Long employeeId, Integer year);

    Optional<LeaveBalance> findByEmployeeIdAndLeaveTypeIdAndYear(Long employeeId, Long leaveTypeId, Integer year);

    @Query("SELECT lb FROM LeaveBalance lb WHERE lb.year = :year ORDER BY lb.employee.id, lb.leaveType.name")
    List<LeaveBalance> findByYear(@Param("year") Integer year);

    @Query("SELECT lb FROM LeaveBalance lb WHERE lb.employee.employeeCode = :empCode AND lb.year = :year")
    List<LeaveBalance> findByEmployeeCodeAndYear(@Param("empCode") String empCode, @Param("year") Integer year);
}
