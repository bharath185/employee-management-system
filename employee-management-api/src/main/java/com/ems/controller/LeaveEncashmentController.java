package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.LeaveEncashmentDTO;
import com.ems.security.CustomUserDetails;
import com.ems.service.LeaveEncashmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

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
    public ResponseEntity<APIResponse<LeaveEncashmentDTO>> createEncashment(@RequestBody LeaveEncashmentDTO dto) {
        return ResponseEntity.ok(APIResponse.success("Encashment created", encashmentService.createEncashment(dto)));
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

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> exportExcel() {
        byte[] data = encashmentService.exportExcel();
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Encashments.xlsx")
            .body(data);
    }

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Map<String, Object>>> importExcel(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(APIResponse.success("Import completed", encashmentService.importExcel(file)));
    }

    @GetMapping("/sample")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> downloadSample() {
        byte[] data = encashmentService.generateSampleExcel();
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Encashment_Sample.xlsx")
            .body(data);
    }
}
