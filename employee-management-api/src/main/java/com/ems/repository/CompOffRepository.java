package com.ems.repository;

import com.ems.model.CompOff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CompOffRepository extends JpaRepository<CompOff, Long> {

    List<CompOff> findByEmployeeIdOrderByEarnedDateDesc(Long employeeId);

    List<CompOff> findByEmployeeIdAndStatusOrderByEarnedDateDesc(Long employeeId, String status);

    Optional<CompOff> findFirstByEmployeeIdAndStatusOrderByEarnedDateAsc(Long employeeId, String status);

    Optional<CompOff> findFirstByEmployeeIdAndStatusOrderByAvailedDateDesc(Long employeeId, String status);

    long countByEmployeeIdAndStatus(Long employeeId, String status);

    boolean existsByEmployeeIdAndEarnedDateAndStatus(Long employeeId, LocalDate earnedDate, String status);

    List<CompOff> findAllByOrderByEarnedDateDesc();
}
