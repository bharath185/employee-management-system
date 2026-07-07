package com.ems.repository;

import com.ems.model.EmployeeLanguage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeLanguageRepository extends JpaRepository<EmployeeLanguage, Long> {

    List<EmployeeLanguage> findByEmployeeId(Long employeeId);

    @Modifying
    @Query("DELETE FROM EmployeeLanguage el WHERE el.employee.id = :employeeId")
    void deleteByEmployeeId(@Param("employeeId") Long employeeId);
}
