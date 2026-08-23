package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.SalaryMasterDTO;
import com.ems.model.SalaryMasterHistory;
import com.ems.model.SalaryMasterSnapshot;
import com.ems.service.SalaryMasterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

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

    @PostMapping("/init-all")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<SalaryMasterDTO>>> initForAll() {
        return ResponseEntity.ok(APIResponse.success("Initialized salary masters for all live employees", salaryMasterService.initForAll()));
    }

    @PostMapping("/init/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<SalaryMasterDTO>> initForEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(APIResponse.success(salaryMasterService.initForEmployee(employeeId)));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> exportExcel() {
        byte[] bytes = salaryMasterService.exportSalaryMastersToExcel();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Salary_Master_Export.xlsx")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(bytes);
    }

    @GetMapping("/template")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] bytes = salaryMasterService.generateSampleExcelTemplate();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Salary_Master_Import_Template.xlsx")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(bytes);
    }

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Map<String, Object>>> importExcel(@RequestParam("file") MultipartFile file) {
        Map<String, Object> result = salaryMasterService.importSalaryMastersFromExcel(file);
        return ResponseEntity.ok(APIResponse.success("Salary masters imported successfully", result));
    }

    @PostMapping("/seed-samples")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Map<String, Object>>> seedSamples() {
        Map<String, Object> result = salaryMasterService.seedSampleSalaries();
        return ResponseEntity.ok(APIResponse.success("Sample salary masters created and synced", result));
    }

    @PostMapping("/sync-month")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Map<String, Object>>> syncToMonth(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        Map<String, Object> result = salaryMasterService.syncToMonthlySalaries(year, month);
        return ResponseEntity.ok(APIResponse.success("Salary masters synced to " + month + "/" + year, result));
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
