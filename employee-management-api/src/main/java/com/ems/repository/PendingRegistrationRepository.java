package com.ems.repository;

import com.ems.model.PendingRegistration;
import com.ems.model.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, Long> {

    List<PendingRegistration> findByStatusOrderByCreatedAtDesc(RegistrationStatus status);

    Optional<PendingRegistration> findByRegistrationCode(String registrationCode);

    boolean existsByAadharNumber(String aadharNumber);

    boolean existsByMobile(String mobile);

    @Query("SELECT COUNT(p) FROM PendingRegistration p WHERE p.status = 'PENDING'")
    long countPending();
}
