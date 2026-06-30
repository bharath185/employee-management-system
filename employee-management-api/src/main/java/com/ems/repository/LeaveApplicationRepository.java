package com.ems.repository;

import com.ems.model.LeaveApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveApplicationRepository extends JpaRepository<LeaveApplication, Long> {

    List<LeaveApplication> findByEmployeeIdAndStatus(Long employeeId, String status);

    @Query("SELECT la FROM LeaveApplication la WHERE la.employee.id = :employeeId AND YEAR(la.fromDate) = :year ORDER BY la.fromDate DESC")
    List<LeaveApplication> findByEmployeeIdAndYear(@Param("employeeId") Long employeeId, @Param("year") Integer year);

    @Query("SELECT la FROM LeaveApplication la WHERE YEAR(la.fromDate) = :year AND MONTH(la.fromDate) = :month ORDER BY la.employee.employeeCode, la.fromDate")
    List<LeaveApplication> findByMonth(@Param("year") Integer year, @Param("month") Integer month);

    @Query("SELECT la FROM LeaveApplication la WHERE la.status = :status AND YEAR(la.fromDate) = :year ORDER BY la.employee.employeeCode")
    List<LeaveApplication> findByStatusAndYear(@Param("status") String status, @Param("year") Integer year);

    @Query("SELECT la FROM LeaveApplication la WHERE la.employee.employeeCode = :empCode ORDER BY la.fromDate DESC")
    List<LeaveApplication> findByEmployeeCode(@Param("empCode") String empCode);

    Page<LeaveApplication> findByStatus(String status, Pageable pageable);

    @Query("SELECT la FROM LeaveApplication la WHERE la.fromDate >= :from AND la.toDate <= :to ORDER BY la.employee.employeeCode, la.fromDate")
    List<LeaveApplication> findByDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
