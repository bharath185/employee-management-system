package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.model.CompOff;
import com.ems.security.CustomUserDetails;
import com.ems.service.CompOffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/leave/comp-offs")
@RequiredArgsConstructor
public class CompOffController {

    private final CompOffService compOffService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<CompOff>>> getCompOffs(@RequestParam(required = false) Long employeeId) {
        return ResponseEntity.ok(APIResponse.success(compOffService.getCompOffs(employeeId)));
    }

    @GetMapping("/my")
    public ResponseEntity<APIResponse<List<CompOff>>> getMyCompOffs(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(APIResponse.success(compOffService.getCompOffs(user.getEmployeeId())));
    }

    @GetMapping("/available/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Long>> getAvailableCount(@PathVariable Long employeeId) {
        return ResponseEntity.ok(APIResponse.success(compOffService.getAvailableCount(employeeId)));
    }

    @GetMapping("/available/my")
    public ResponseEntity<APIResponse<Long>> getMyAvailableCount(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(APIResponse.success(compOffService.getAvailableCount(user.getEmployeeId())));
    }

    @PostMapping("/earn/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<CompOff>> earnCompOff(
            @PathVariable Long employeeId,
            @RequestParam String date) {
        return ResponseEntity.ok(APIResponse.success("Comp-Off earned",
            compOffService.earnCompOff(employeeId, java.time.LocalDate.parse(date))));
    }

    @PutMapping("/{id}/avail")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<CompOff>> availCompOff(@PathVariable Long id) {
        return ResponseEntity.ok(APIResponse.success("Comp-Off availed", compOffService.availCompOff(id)));
    }

    @PutMapping("/expire-overdue")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<String>> expireOverdue() {
        int count = compOffService.expireOverdue();
        return ResponseEntity.ok(APIResponse.success(count + " Comp-Offs expired", null));
    }
}
