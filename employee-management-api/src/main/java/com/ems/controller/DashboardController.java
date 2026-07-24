package com.ems.controller;

import com.ems.dto.DashboardStatsDTO;
import com.ems.dto.EmployeeDTO;
import com.ems.dto.APIResponse;
import com.ems.repository.EmployeeRepository;
import com.ems.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/dashboard")
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final EmployeeRepository employeeRepository;

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

    @GetMapping("/report-analytics")
    public ResponseEntity<APIResponse<Map<String, Object>>> getReportAnalytics() {
        DashboardStatsDTO stats = dashboardService.getStats();

        Map<String, Object> result = new LinkedHashMap<>();

        Map<String, Object> absenteeism = new LinkedHashMap<>();
        absenteeism.put("totalEmployees", stats.getActiveEmployees());
        absenteeism.put("absentToday", 0);
        absenteeism.put("absentThisMonth", 0);
        absenteeism.put("avgAbsenteeismRate", "0.0%");
        result.put("absenteeism", absenteeism);

        Map<String, Object> attrition = new LinkedHashMap<>();
        attrition.put("totalExited", stats.getExitedEmployees());
        attrition.put("exitedThisMonth", stats.getExitedThisMonth());
        double attritionRate = stats.getTotalEmployees() > 0
            ? (double) stats.getExitedEmployees() / stats.getTotalEmployees() * 100 : 0;
        attrition.put("attritionRate", String.format("%.1f%%", attritionRate));
        result.put("attrition", attrition);

        Map<String, Object> demographics = new LinkedHashMap<>();
        demographics.put("genderDistribution", stats.getGenderDistribution());
        demographics.put("ageBracketDistribution", stats.getAgeBracketDistribution());
        demographics.put("designationDistribution", stats.getDesignationDistribution());
        demographics.put("statusDistribution", stats.getStatusDistribution());
        result.put("demographics", demographics);

        return ResponseEntity.ok(APIResponse.success(result));
    }
}
