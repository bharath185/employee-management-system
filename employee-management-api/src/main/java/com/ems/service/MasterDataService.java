package com.ems.service;

import com.ems.dto.MasterDataDTO;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.MasterData;
import com.ems.repository.MasterDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MasterDataService {

    private final MasterDataRepository masterDataRepository;

    public List<MasterDataDTO> getByCategory(String category) {
        return masterDataRepository
            .findByCategoryIgnoreCaseAndActiveTrueOrderBySortOrderAsc(category)
            .stream()
            .map(MasterDataDTO::fromEntity)
            .toList();
    }

    public List<String> getAllCategories() {
        return masterDataRepository.findDistinctCategories();
    }

    public MasterDataDTO create(MasterDataDTO dto) {
        MasterData entity = masterDataRepository
            .findByCategoryIgnoreCaseAndCodeIgnoreCase(dto.getCategory(), dto.getCode())
            .orElseGet(() -> MasterData.builder()
                .category(dto.getCategory())
                .code(dto.getCode())
                .build());
        entity.setValue(dto.getValue());
        entity.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : entity.getSortOrder());
        entity.setActive(dto.getActive() != null ? dto.getActive() : true);
        entity = masterDataRepository.save(entity);
        return MasterDataDTO.fromEntity(entity);
    }

    public MasterDataDTO update(Long id, MasterDataDTO dto) {
        MasterData existing = masterDataRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Master data not found with id: " + id));

        existing.setCategory(dto.getCategory());
        existing.setCode(dto.getCode());
        existing.setValue(dto.getValue());
        existing.setSortOrder(dto.getSortOrder() != null ?
            dto.getSortOrder() : existing.getSortOrder());
        existing.setActive(dto.getActive() != null ?
            dto.getActive() : existing.getActive());

        existing = masterDataRepository.save(existing);
        return MasterDataDTO.fromEntity(existing);
    }

    public void delete(Long id) {
        if (!masterDataRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                "Master data not found with id: " + id);
        }
        masterDataRepository.deleteById(id);
    }
}
