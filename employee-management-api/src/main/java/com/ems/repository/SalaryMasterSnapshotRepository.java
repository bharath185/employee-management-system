package com.ems.repository;

import com.ems.model.SalaryMasterSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalaryMasterSnapshotRepository extends JpaRepository<SalaryMasterSnapshot, Long> {
    List<SalaryMasterSnapshot> findByEmployeeIdOrderBySnapshotYearDescSnapshotMonthDesc(Long employeeId);
    List<SalaryMasterSnapshot> findByEmployeeIdAndSnapshotYearAndSnapshotMonth(Long employeeId, Integer year, Integer month);
}
