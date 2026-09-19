package com.ems.repository;

import com.ems.model.FormFieldConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FormFieldConfigRepository extends JpaRepository<FormFieldConfig, Long> {
    List<FormFieldConfig> findAllByOrderByTabNameAscSortOrderAscIdAsc();
    List<FormFieldConfig> findByIsVisibleTrueOrderByTabNameAscSortOrderAscIdAsc();
    Optional<FormFieldConfig> findByFieldKey(String fieldKey);
    boolean existsByFieldKey(String fieldKey);
}
