package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.CompOffDTO;
import com.ems.security.CustomUserDetails;
import com.ems.service.CompOffService;
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
@RequestMapping("/leave/comp-offs")
@RequiredArgsConstructor
public class CompOffController {

    private final CompOffService compOffService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<CompOffDTO>>> getCompOffs(@RequestParam(required = false) Long employeeId) {
        return ResponseEntity.ok(APIResponse.success(compOffService.getCompOffs(employeeId)));
    }

    @GetMapping("/my")
    public ResponseEntity<APIResponse<List<CompOffDTO>>> getMyCompOffs(@AuthenticationPrincipal CustomUserDetails user) {
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
    public ResponseEntity<APIResponse<CompOffDTO>> earnCompOff(
            @PathVariable Long employeeId,
            @RequestParam String date) {
        return ResponseEntity.ok(APIResponse.success("Comp-Off earned",
            compOffService.earnCompOff(employeeId, java.time.LocalDate.parse(date))));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> exportExcel() {
        byte[] data = compOffService.exportExcel();
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=CompOffs.xlsx")
            .body(data);
    }

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Map<String, Object>>> importExcel(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(APIResponse.success("Import completed", compOffService.importExcel(file)));
    }

    @GetMapping("/sample")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> downloadSample() {
        byte[] data = compOffService.generateSampleExcel();
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=CompOff_Sample.xlsx")
            .body(data);
    }
}
