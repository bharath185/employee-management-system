package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.service.LabourReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/labour-reports")
@RequiredArgsConstructor
public class LabourReportController {

    private final LabourReportService labourReportService;

    @GetMapping("/bonus-register")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<Map<String, Object>>>> getBonusRegister(
            @RequestParam Integer year, @RequestParam Integer month) {
        return ResponseEntity.ok(APIResponse.success(labourReportService.getBonusRegister(year, month)));
    }

    @GetMapping("/overtime-register")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<Map<String, Object>>>> getOvertimeRegister(
            @RequestParam Integer year, @RequestParam Integer month) {
        return ResponseEntity.ok(APIResponse.success(labourReportService.getOvertimeRegister(year, month)));
    }

    @GetMapping("/comp-off-register")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<Map<String, Object>>>> getCompOffRegister(
            @RequestParam Integer year) {
        return ResponseEntity.ok(APIResponse.success(labourReportService.getCompOffRegister(year)));
    }
}