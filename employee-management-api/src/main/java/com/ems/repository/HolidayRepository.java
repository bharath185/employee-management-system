package com.ems.repository;

import com.ems.model.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {

    List<Holiday> findByYear(Integer year);

    Optional<Holiday> findByDate(LocalDate date);

    boolean existsByDate(LocalDate date);

    List<Holiday> findByYearOrderByDateAsc(Integer year);
}
