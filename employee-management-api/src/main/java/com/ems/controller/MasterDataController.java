package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.MasterDataDTO;
import com.ems.model.MasterData;
import com.ems.service.MasterDataService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/masters")
@RequiredArgsConstructor
public class MasterDataController {

    private final MasterDataService masterDataService;

    @GetMapping("/{category}")
    public ResponseEntity<APIResponse<List<MasterDataDTO>>> getByCategory(
            @PathVariable String category) {
        List<MasterDataDTO> data = masterDataService.getByCategory(category.toUpperCase());
        return ResponseEntity.ok(APIResponse.success(data));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<List<String>>> getAllCategories() {
        List<String> categories = masterDataService.getAllCategories();
        return ResponseEntity.ok(APIResponse.success(categories));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<MasterDataDTO>> create(
            @Valid @RequestBody MasterDataDTO dto) {
        MasterDataDTO created = masterDataService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(APIResponse.success("Master data created", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<MasterDataDTO>> update(
            @PathVariable Long id,
            @Valid @RequestBody MasterDataDTO dto) {
        MasterDataDTO updated = masterDataService.update(id, dto);
        return ResponseEntity.ok(APIResponse.success("Master data updated", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Void>> delete(@PathVariable Long id) {
        masterDataService.delete(id);
        return ResponseEntity.ok(APIResponse.success("Master data deleted", null));
    }
}
