package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.ReportTemplateDTO;
import com.ems.model.ReportTemplate;
import com.ems.repository.ReportTemplateRepository;
import com.ems.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/report-templates")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class ReportTemplateController {

    private final ReportTemplateRepository repository;

    @GetMapping
    public ResponseEntity<APIResponse<List<ReportTemplateDTO>>> getAll(
            @RequestParam(value = "category", required = false) String category) {
        List<ReportTemplate> list = (category != null && !category.isBlank())
            ? repository.findByCategoryOrderByCreatedAtDesc(category)
            : repository.findAllByOrderByCreatedAtDesc();
        List<ReportTemplateDTO> dtos = list.stream()
            .map(ReportTemplateDTO::fromEntity)
            .collect(Collectors.toList());
        return ResponseEntity.ok(APIResponse.success("Templates fetched", dtos));
    }

    @PostMapping
    public ResponseEntity<APIResponse<ReportTemplateDTO>> create(
            @RequestBody ReportTemplateDTO dto,
            @AuthenticationPrincipal CustomUserDetails user) {
        ReportTemplate template = ReportTemplate.builder()
            .name(dto.getName())
            .description(dto.getDescription())
            .category(dto.getCategory() != null ? dto.getCategory() : "EMPLOYEE")
            .filtersJson(dto.getFiltersJson())
            .columnsJson(dto.getColumnsJson())
            .sortBy(dto.getSortBy())
            .sortDirection(dto.getSortDirection())
            .createdBy(user != null ? user.getUsername() : "system")
            .build();
        ReportTemplate saved = repository.save(template);
        return ResponseEntity.ok(APIResponse.success("Template saved successfully", ReportTemplateDTO.fromEntity(saved)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<APIResponse<ReportTemplateDTO>> update(
            @PathVariable Long id,
            @RequestBody ReportTemplateDTO dto) {
        ReportTemplate template = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Template not found: " + id));
        if (dto.getName() != null) template.setName(dto.getName());
        if (dto.getDescription() != null) template.setDescription(dto.getDescription());
        if (dto.getFiltersJson() != null) template.setFiltersJson(dto.getFiltersJson());
        if (dto.getColumnsJson() != null) template.setColumnsJson(dto.getColumnsJson());
        if (dto.getSortBy() != null) template.setSortBy(dto.getSortBy());
        if (dto.getSortDirection() != null) template.setSortDirection(dto.getSortDirection());
        ReportTemplate saved = repository.save(template);
        return ResponseEntity.ok(APIResponse.success("Template updated successfully", ReportTemplateDTO.fromEntity(saved)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<Void>> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok(APIResponse.success("Template deleted successfully", null));
    }
}
