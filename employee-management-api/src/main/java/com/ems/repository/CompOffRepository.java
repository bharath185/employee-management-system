package com.ems.repository;

import com.ems.model.CompOff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CompOffRepository extends JpaRepository<CompOff, Long> {

    List<CompOff> findByEmployeeIdOrderByEarnedDateDesc(Long employeeId);

    List<CompOff> findByEmployeeIdAndStatusOrderByEarnedDateDesc(Long employeeId, String status);

    List<CompOff> findByStatusAndExpiryDateBefore(String status, LocalDate date);

    long countByEmployeeIdAndStatus(Long employeeId, String status);

    boolean existsByEmployeeIdAndEarnedDateAndStatus(Long employeeId, LocalDate earnedDate, String status);
}
