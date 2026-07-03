package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.SalaryMasterDTO;
import com.ems.model.SalaryMasterHistory;
import com.ems.model.SalaryMasterSnapshot;
import com.ems.service.SalaryMasterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/payroll/salary-master")
@RequiredArgsConstructor
public class SalaryMasterController {

    private final SalaryMasterService salaryMasterService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<SalaryMasterDTO>>> getAll() {
        return ResponseEntity.ok(APIResponse.success(salaryMasterService.getAll()));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<SalaryMasterDTO>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(APIResponse.success(salaryMasterService.getByEmployeeId(employeeId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<SalaryMasterDTO>> save(@Valid @RequestBody SalaryMasterDTO dto) {
        return ResponseEntity.ok(APIResponse.success("Salary master saved", salaryMasterService.saveOrUpdate(dto)));
    }

    @PostMapping("/init/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<SalaryMasterDTO>> initForEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(APIResponse.success(salaryMasterService.initForEmployee(employeeId)));
    }

    @GetMapping("/history/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<SalaryMasterHistory>>> getHistory(@PathVariable Long employeeId) {
        return ResponseEntity.ok(APIResponse.success(salaryMasterService.getHistory(employeeId)));
    }

    @GetMapping("/snapshots/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<SalaryMasterSnapshot>>> getSnapshots(@PathVariable Long employeeId) {
        return ResponseEntity.ok(APIResponse.success(salaryMasterService.getSnapshots(employeeId)));
    }
}
