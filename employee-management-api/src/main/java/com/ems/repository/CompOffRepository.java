package com.ems.repository;

import com.ems.model.CompOff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface CompOffRepository extends JpaRepository<CompOff, Long> {

    @Query("SELECT c FROM CompOff c JOIN FETCH c.employee WHERE c.employee.id = :employeeId ORDER BY c.earnedDate DESC")
    List<CompOff> findByEmployeeIdOrderByEarnedDateDesc(@Param("employeeId") Long employeeId);

    @Query("SELECT c FROM CompOff c JOIN FETCH c.employee WHERE c.employee.id = :employeeId AND c.status = :status ORDER BY c.earnedDate DESC")
    List<CompOff> findByEmployeeIdAndStatusOrderByEarnedDateDesc(@Param("employeeId") Long employeeId, @Param("status") String status);

    Optional<CompOff> findFirstByEmployeeIdAndStatusOrderByEarnedDateAsc(Long employeeId, String status);

    Optional<CompOff> findFirstByEmployeeIdAndStatusOrderByAvailedDateDesc(Long employeeId, String status);

    Optional<CompOff> findFirstByEmployeeIdAndEarnedDateAndStatus(Long employeeId, LocalDate earnedDate, String status);

    Optional<CompOff> findFirstByEmployeeIdAndAvailedDateAndStatus(Long employeeId, LocalDate availedDate, String status);

    long countByEmployeeIdAndStatus(Long employeeId, String status);

    boolean existsByEmployeeIdAndEarnedDateAndStatus(Long employeeId, LocalDate earnedDate, String status);

    @Query("SELECT c FROM CompOff c JOIN FETCH c.employee ORDER BY c.earnedDate DESC")
    List<CompOff> findAllByOrderByEarnedDateDesc();
}
