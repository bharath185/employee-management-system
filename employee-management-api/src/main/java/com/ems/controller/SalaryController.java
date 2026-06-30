package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.SalaryDTO;
import com.ems.service.SalaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/salaries")
@RequiredArgsConstructor
public class SalaryController {

    private final SalaryService salaryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<SalaryDTO>>> getSalaries(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(APIResponse.success(salaryService.getSalaries(year, month, page, size).getContent()));
    }

    @GetMapping("/period")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<SalaryDTO>>> getSalariesByPeriod(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        return ResponseEntity.ok(APIResponse.success(salaryService.getSalariesByPeriod(year, month)));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR') or #employeeId == authentication.principal.employeeId")
    public ResponseEntity<APIResponse<List<SalaryDTO>>> getSalariesByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(APIResponse.success(salaryService.getSalariesByEmployee(employeeId)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<SalaryDTO>> getSalaryById(@PathVariable Long id) {
        return ResponseEntity.ok(APIResponse.success(salaryService.getSalaryById(id)));
    }

    @GetMapping("/years")
    public ResponseEntity<APIResponse<List<Integer>>> getDistinctYears() {
        return ResponseEntity.ok(APIResponse.success(salaryService.getDistinctYears()));
    }

    @GetMapping("/months/{year}")
    public ResponseEntity<APIResponse<List<Integer>>> getDistinctMonths(@PathVariable Integer year) {
        return ResponseEntity.ok(APIResponse.success(salaryService.getDistinctMonths(year)));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Map<String, Object>>> getSalaryStats(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        return ResponseEntity.ok(APIResponse.success(salaryService.getSalaryStats(year, month)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<SalaryDTO>> createSalary(@Valid @RequestBody SalaryDTO dto) {
        return ResponseEntity.ok(APIResponse.success("Salary record created", salaryService.createSalary(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<SalaryDTO>> updateSalary(@PathVariable Long id, @Valid @RequestBody SalaryDTO dto) {
        return ResponseEntity.ok(APIResponse.success("Salary record updated", salaryService.updateSalary(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Void>> deleteSalary(@PathVariable Long id) {
        salaryService.deleteSalary(id);
        return ResponseEntity.ok(APIResponse.success("Salary record deleted", null));
    }

    @GetMapping("/{id}/slip")
    public ResponseEntity<String> getSalarySlip(@PathVariable Long id) {
        String html = salaryService.generateSalarySlipHtml(id);
        return ResponseEntity.ok()
            .contentType(MediaType.TEXT_HTML)
            .body(html);
    }
}
