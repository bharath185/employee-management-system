package com.ems.repository;

import com.ems.model.EmailConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailConfigRepository extends JpaRepository<EmailConfig, Long> {

    Optional<EmailConfig> findFirstByIsActiveTrue();
}
