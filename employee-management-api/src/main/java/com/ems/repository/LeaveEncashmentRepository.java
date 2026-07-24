package com.ems.repository;

import com.ems.model.LeaveEncashment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveEncashmentRepository extends JpaRepository<LeaveEncashment, Long> {

    List<LeaveEncashment> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    List<LeaveEncashment> findByYearAndMonth(Integer year, Integer month);

    List<LeaveEncashment> findByStatus(String status);

    List<LeaveEncashment> findByEmployeeIdAndYearAndMonth(Long employeeId, Integer year, Integer month);
}
