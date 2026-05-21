package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.DashboardStatsDTO;
import com.ems.dto.EmployeeDTO;
import com.ems.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dashboard")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<APIResponse<DashboardStatsDTO>> getStats() {
        DashboardStatsDTO stats = dashboardService.getStats();
        return ResponseEntity.ok(APIResponse.success(stats));
    }

    @GetMapping("/recent")
    public ResponseEntity<APIResponse<List<EmployeeDTO>>> getRecentEmployees(
            @RequestParam(defaultValue = "10") int limit) {
        List<EmployeeDTO> recent = dashboardService.getRecentEmployees(limit);
        return ResponseEntity.ok(APIResponse.success(recent));
    }

    @GetMapping("/charts/age-bracket")
    public ResponseEntity<APIResponse<List<DashboardStatsDTO.AgeBracketCount>>> getAgeBracketDistribution() {
        return ResponseEntity.ok(APIResponse.success(dashboardService.getAgeBracketDistribution()));
    }

    @GetMapping("/charts/designation")
    public ResponseEntity<APIResponse<List<DashboardStatsDTO.DesignationCount>>> getDesignationDistribution() {
        return ResponseEntity.ok(APIResponse.success(dashboardService.getDesignationDistribution()));
    }
}
