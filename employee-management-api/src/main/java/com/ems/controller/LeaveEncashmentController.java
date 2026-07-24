package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.LeaveEncashmentDTO;
import com.ems.model.LeaveEncashment;
import com.ems.security.CustomUserDetails;
import com.ems.service.LeaveEncashmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/leave/encashments")
@RequiredArgsConstructor
public class LeaveEncashmentController {

    private final LeaveEncashmentService encashmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<LeaveEncashmentDTO>>> getEncashments(
            @RequestParam(required = false) Long employeeId) {
        return ResponseEntity.ok(APIResponse.success(encashmentService.getEncashments(employeeId)));
    }

    @GetMapping("/my")
    public ResponseEntity<APIResponse<List<LeaveEncashmentDTO>>> getMyEncashments(
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(APIResponse.success(encashmentService.getEncashments(user.getEmployeeId())));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<LeaveEncashmentDTO>> createEncashment(@RequestBody LeaveEncashment encashment) {
        return ResponseEntity.ok(APIResponse.success("Encashment created", encashmentService.createEncashment(encashment)));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<LeaveEncashmentDTO>> approveEncashment(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(APIResponse.success("Encashment approved",
            encashmentService.approveEncashment(id, user.getUsername())));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<LeaveEncashmentDTO>> rejectEncashment(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(APIResponse.success("Encashment rejected",
            encashmentService.rejectEncashment(id, user.getUsername())));
    }
}
