package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.EmployeeDTO;
import com.ems.dto.PendingRegistrationDTO;
import com.ems.service.PendingRegistrationService;
import com.ems.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pending-registrations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PendingRegistrationController {

    private final PendingRegistrationService pendingRegistrationService;

    @GetMapping
    public ResponseEntity<APIResponse<List<PendingRegistrationDTO>>> getAll(
            @RequestParam(value = "status", required = false) String status) {
        List<PendingRegistrationDTO> list = pendingRegistrationService.getAllByStatus(status);
        return ResponseEntity.ok(APIResponse.success("Pending registrations fetched", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<APIResponse<PendingRegistrationDTO>> getById(@PathVariable Long id) {
        PendingRegistrationDTO dto = pendingRegistrationService.getById(id);
        return ResponseEntity.ok(APIResponse.success("Registration details fetched", dto));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<APIResponse<EmployeeDTO>> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        APIResponse<EmployeeDTO> response = pendingRegistrationService.approve(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<APIResponse<Void>> reject(
            @PathVariable Long id,
            @RequestParam(value = "reason", required = false) String reason,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        APIResponse<Void> response = pendingRegistrationService.reject(id, reason, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/count")
    public ResponseEntity<APIResponse<Long>> countPending() {
        return ResponseEntity.ok(APIResponse.success("Pending count", pendingRegistrationService.countPending()));
    }
}
