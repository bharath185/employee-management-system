package com.ems.repository;

import com.ems.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {

    Optional<AttendanceRecord> findByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);

    List<AttendanceRecord> findByEmployeeIdAndAttendanceDateBetween(Long employeeId, LocalDate from, LocalDate to);

    List<AttendanceRecord> findByAttendanceDateBetween(LocalDate from, LocalDate to);

    @Query("SELECT a FROM AttendanceRecord a WHERE YEAR(a.attendanceDate) = :year AND MONTH(a.attendanceDate) = :month ORDER BY a.employee.employeeCode, a.attendanceDate")
    List<AttendanceRecord> findByYearAndMonth(@Param("year") int year, @Param("month") int month);
}
