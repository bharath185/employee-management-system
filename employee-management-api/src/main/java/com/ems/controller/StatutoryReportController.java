package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.service.StatutoryReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/statutory-reports")
@RequiredArgsConstructor
public class StatutoryReportController {

    private final StatutoryReportService statutoryReportService;

    @GetMapping("/individual-worker-details")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<String>> getIndividualWorkerDetails(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        String html = statutoryReportService.generateIndividualWorkerDetails(year, month);
        return ResponseEntity.ok(APIResponse.success(html));
    }

    @GetMapping("/individual-worker-details/excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> getIndividualWorkerDetailsExcel(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        byte[] excel = statutoryReportService.generateIndividualWorkerDetailsExcel(year, month);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=individual_worker_details_" + year + "_" + month + ".xlsx")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(excel);
    }

    @GetMapping("/wages-register")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<String>> getWagesRegister(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        String html = statutoryReportService.generateWagesRegister(year, month);
        return ResponseEntity.ok(APIResponse.success(html));
    }

    @GetMapping("/wages-register/excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> getWagesRegisterExcel(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        byte[] excel = statutoryReportService.generateWagesRegisterExcel(year, month);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=wages_register_" + year + "_" + month + ".xlsx")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(excel);
    }

    @GetMapping("/leave-register")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<String>> getLeaveRegister(@RequestParam Integer year) {
        String html = statutoryReportService.generateLeaveRegister(year);
        return ResponseEntity.ok(APIResponse.success(html));
    }

    @GetMapping("/leave-register/excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> getLeaveRegisterExcel(
            @RequestParam Integer year,
            @RequestParam(required = false) String employeeIds) {
        byte[] excel = statutoryReportService.generateLeaveRegisterExcel(year, employeeIds);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=leave_register_" + year + ".xlsx")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(excel);
    }
}
