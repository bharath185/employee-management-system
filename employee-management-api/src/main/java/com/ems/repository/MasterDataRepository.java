package com.ems.repository;

import com.ems.model.MasterData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MasterDataRepository extends JpaRepository<MasterData, Long> {

    List<MasterData> findByCategoryIgnoreCaseOrderBySortOrderAsc(String category);

    List<MasterData> findByCategoryIgnoreCaseAndActiveTrueOrderBySortOrderAsc(String category);

    Optional<MasterData> findByCategoryIgnoreCaseAndCodeIgnoreCase(String category, String code);

    boolean existsByCategoryIgnoreCaseAndCodeIgnoreCase(String category, String code);

    List<String> findDistinctCategoryByOrderByCategory();
}
