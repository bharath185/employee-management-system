package com.ems.repository;

import com.ems.model.PayrollProcess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollProcessRepository extends JpaRepository<PayrollProcess, Long> {

    Optional<PayrollProcess> findByProcessYearAndProcessMonth(Integer year, Integer month);

    Optional<PayrollProcess> findTopByOrderByCreatedAtDesc();

    List<PayrollProcess> findByProcessYearAndProcessMonthOrderByCreatedAtDesc(Integer year, Integer month);

    List<PayrollProcess> findByProcessYearOrderByProcessMonthDesc(Integer year);
}
