package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.FormFieldConfigDTO;
import com.ems.service.FormFieldConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/form-fields")
@RequiredArgsConstructor
public class FormFieldConfigController {

    private final FormFieldConfigService service;

    @GetMapping
    public ResponseEntity<APIResponse<List<FormFieldConfigDTO>>> getAllConfigs() {
        return ResponseEntity.ok(APIResponse.success(service.getAllConfigs()));
    }

    @GetMapping("/visible")
    public ResponseEntity<APIResponse<List<FormFieldConfigDTO>>> getVisibleConfigs() {
        return ResponseEntity.ok(APIResponse.success(service.getVisibleConfigs()));
    }

    @PutMapping("/{id}/toggle-mandatory")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<FormFieldConfigDTO>> toggleMandatory(@PathVariable Long id) {
        return ResponseEntity.ok(APIResponse.success("Mandatory status updated", service.toggleMandatory(id)));
    }

    @PutMapping("/{id}/toggle-visibility")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<FormFieldConfigDTO>> toggleVisibility(@PathVariable Long id) {
        return ResponseEntity.ok(APIResponse.success("Visibility updated", service.toggleVisibility(id)));
    }

    @PutMapping("/bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<FormFieldConfigDTO>>> updateBulk(@RequestBody List<FormFieldConfigDTO> dtos) {
        return ResponseEntity.ok(APIResponse.success("Field configurations updated successfully", service.updateBulk(dtos)));
    }

    @PostMapping("/custom")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<FormFieldConfigDTO>> createCustomField(@RequestBody FormFieldConfigDTO dto) {
        FormFieldConfigDTO created = service.createCustomField(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(APIResponse.success("Custom field created successfully", created));
    }

    @DeleteMapping("/custom/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Void>> deleteCustomField(@PathVariable Long id) {
        service.deleteCustomField(id);
        return ResponseEntity.ok(APIResponse.success("Custom field deleted successfully", null));
    }
}
