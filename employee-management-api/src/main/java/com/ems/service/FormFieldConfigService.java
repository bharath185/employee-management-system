package com.ems.service;

import com.ems.dto.FormFieldConfigDTO;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.FormFieldConfig;
import com.ems.repository.FormFieldConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FormFieldConfigService {

    private final FormFieldConfigRepository repository;

    @Transactional(readOnly = true)
    public List<FormFieldConfigDTO> getAllConfigs() {
        return repository.findAllByOrderByTabNameAscSortOrderAscIdAsc()
                .stream()
                .map(FormFieldConfigDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FormFieldConfigDTO> getVisibleConfigs() {
        return repository.findByIsVisibleTrueOrderByTabNameAscSortOrderAscIdAsc()
                .stream()
                .map(FormFieldConfigDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public FormFieldConfigDTO toggleMandatory(Long id) {
        FormFieldConfig config = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FormFieldConfig not found with id: " + id));
        config.setIsMandatory(!Boolean.TRUE.equals(config.getIsMandatory()));
        return FormFieldConfigDTO.fromEntity(repository.save(config));
    }

    @Transactional
    public FormFieldConfigDTO toggleVisibility(Long id) {
        FormFieldConfig config = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FormFieldConfig not found with id: " + id));
        config.setIsVisible(!Boolean.TRUE.equals(config.getIsVisible()));
        return FormFieldConfigDTO.fromEntity(repository.save(config));
    }

    @Transactional
    public List<FormFieldConfigDTO> updateBulk(List<FormFieldConfigDTO> dtos) {
        for (FormFieldConfigDTO dto : dtos) {
            if (dto.getId() != null) {
                repository.findById(dto.getId()).ifPresent(entity -> {
                    if (dto.getIsMandatory() != null) entity.setIsMandatory(dto.getIsMandatory());
                    if (dto.getIsVisible() != null) entity.setIsVisible(dto.getIsVisible());
                    if (dto.getFieldLabel() != null) entity.setFieldLabel(dto.getFieldLabel());
                    if (dto.getTabName() != null) entity.setTabName(dto.getTabName());
                    if (dto.getSortOrder() != null) entity.setSortOrder(dto.getSortOrder());
                    if (dto.getPlaceholder() != null) entity.setPlaceholder(dto.getPlaceholder());
                    repository.save(entity);
                });
            }
        }
        return getAllConfigs();
    }

    @Transactional
    public FormFieldConfigDTO createCustomField(FormFieldConfigDTO dto) {
        String key = dto.getFieldKey();
        if (key == null || key.trim().isEmpty()) {
            key = "custom_" + dto.getFieldLabel().toLowerCase().replaceAll("[^a-z0-9]", "_");
        }
        key = key.trim();
        if (repository.existsByFieldKey(key)) {
            key = key + "_" + System.currentTimeMillis() % 10000;
        }

        FormFieldConfig entity = FormFieldConfig.builder()
                .fieldKey(key)
                .fieldLabel(dto.getFieldLabel())
                .tabName(dto.getTabName() != null ? dto.getTabName() : "Personal Info")
                .fieldType(dto.getFieldType() != null ? dto.getFieldType().toUpperCase() : "TEXT")
                .masterCategory(dto.getMasterCategory())
                .options(dto.getOptions())
                .isMandatory(Boolean.TRUE.equals(dto.getIsMandatory()))
                .isVisible(dto.getIsVisible() != null ? dto.getIsVisible() : true)
                .isCustom(true)
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 99)
                .placeholder(dto.getPlaceholder())
                .build();

        FormFieldConfig saved = repository.save(entity);
        log.info("Created custom form field: key={}, label={}", saved.getFieldKey(), saved.getFieldLabel());
        return FormFieldConfigDTO.fromEntity(saved);
    }

    @Transactional
    public void deleteCustomField(Long id) {
        FormFieldConfig config = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FormFieldConfig not found with id: " + id));
        if (Boolean.TRUE.equals(config.getIsCustom())) {
            repository.delete(config);
            log.info("Deleted custom form field: {}", config.getFieldKey());
        } else {
            throw new IllegalArgumentException("Cannot delete standard system field: " + config.getFieldKey());
        }
    }
}
