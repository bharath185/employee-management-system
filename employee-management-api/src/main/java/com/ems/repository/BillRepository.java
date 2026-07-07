package com.ems.repository;

import com.ems.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByMonthAndYearOrderByCreatedAtDesc(int month, int year);
    List<Bill> findByYearOrderByCreatedAtDesc(int year);
    List<Bill> findByStatusOrderByCreatedAtDesc(String status);
}
