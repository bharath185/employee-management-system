package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.LeaveApplicationDTO;
import com.ems.dto.LeaveBalanceDTO;
import com.ems.model.LeaveType;
import com.ems.security.CustomUserDetails;
import com.ems.service.LeaveExcelService;
import com.ems.service.LeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@RestController
@RequestMapping("/leave")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;
    private final LeaveExcelService leaveExcelService;

    @GetMapping("/types")
    public ResponseEntity<APIResponse<List<LeaveType>>> getLeaveTypes() {
        return ResponseEntity.ok(APIResponse.success(leaveService.getLeaveTypes()));
    }

    @PostMapping("/types")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<LeaveType>> createLeaveType(@RequestBody LeaveType leaveType) {
        return ResponseEntity.ok(APIResponse.success("Leave type created", leaveService.createLeaveType(leaveType)));
    }

    @GetMapping("/balances")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<LeaveBalanceDTO>>> getLeaveBalances(
            @RequestParam(required = false) Long employeeId,
            @RequestParam Integer year) {
        return ResponseEntity.ok(APIResponse.success(leaveService.getLeaveBalances(employeeId, year)));
    }

    @PostMapping("/balances/init/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Void>> initializeBalances(
            @PathVariable Long employeeId,
            @RequestParam Integer year) {
        leaveService.initializeLeaveBalances(employeeId, year);
        return ResponseEntity.ok(APIResponse.success("Leave balances initialized", null));
    }

    @PostMapping("/balances/init-all")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<String>> initializeAllBalances(@RequestParam Integer year) {
        int count = leaveService.initializeAllLeaveBalances(year);
        return ResponseEntity.ok(APIResponse.success("Leave balances initialized for " + count + " employees", null));
    }

    @PutMapping("/balances/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<LeaveBalanceDTO>> updateBalance(
            @PathVariable Long id,
            @RequestBody LeaveBalanceDTO dto) {
        return ResponseEntity.ok(APIResponse.success("Balance updated", leaveService.updateLeaveBalance(id, dto)));
    }

    @GetMapping("/applications")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Page<LeaveApplicationDTO>>> getApplications(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(APIResponse.success(leaveService.getLeaveApplications(status, page, size)));
    }

    @GetMapping("/applications/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR') or #employeeId == authentication.principal.employeeId")
    public ResponseEntity<APIResponse<List<LeaveApplicationDTO>>> getApplicationsByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(APIResponse.success(leaveService.getLeaveApplicationsByEmployee(employeeId)));
    }

    @GetMapping("/applications/month")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<LeaveApplicationDTO>>> getApplicationsByMonth(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        return ResponseEntity.ok(APIResponse.success(leaveService.getLeaveApplicationsByMonth(year, month)));
    }

    @PostMapping("/applications")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR') or #dto.employeeId == authentication.principal.employeeId")
    public ResponseEntity<APIResponse<LeaveApplicationDTO>> applyLeave(
            @RequestBody LeaveApplicationDTO dto,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(APIResponse.success("Leave application submitted", leaveService.applyLeave(dto)));
    }

    @PutMapping("/applications/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<LeaveApplicationDTO>> approveLeave(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(APIResponse.success("Leave approved", leaveService.approveLeave(id, user.getUsername())));
    }

    @PutMapping("/applications/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<LeaveApplicationDTO>> rejectLeave(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(APIResponse.success("Leave rejected", leaveService.rejectLeave(id, user.getUsername())));
    }

    @PutMapping("/applications/{id}/cancel")
    public ResponseEntity<APIResponse<Void>> cancelLeave(@PathVariable Long id) {
        leaveService.cancelLeave(id);
        return ResponseEntity.ok(APIResponse.success("Leave cancelled", null));
    }

    @PutMapping("/applications/{id}/cancel/self")
    public ResponseEntity<APIResponse<Void>> cancelMyLeave(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user) {
        leaveService.cancelLeaveIfOwn(id, user.getEmployeeId());
        return ResponseEntity.ok(APIResponse.success("Leave cancelled", null));
    }

    @GetMapping("/balances/my")
    public ResponseEntity<APIResponse<List<LeaveBalanceDTO>>> getMyBalances(
            @AuthenticationPrincipal CustomUserDetails user) {
        int year = java.time.Year.now().getValue();
        return ResponseEntity.ok(APIResponse.success(leaveService.getLeaveBalances(user.getEmployeeId(), year)));
    }

    @PostMapping("/applications/self")
    public ResponseEntity<APIResponse<LeaveApplicationDTO>> applyLeaveSelf(
            @RequestBody LeaveApplicationDTO dto,
            @AuthenticationPrincipal CustomUserDetails user) {
        dto.setEmployeeId(user.getEmployeeId());
        return ResponseEntity.ok(APIResponse.success("Leave application submitted", leaveService.applyLeave(dto)));
    }

    @GetMapping("/applications/my")
    public ResponseEntity<APIResponse<List<LeaveApplicationDTO>>> getMyApplications(
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(APIResponse.success(leaveService.getLeaveApplicationsByEmployee(user.getEmployeeId())));
    }

    // ==================== EXCEL SYNC ====================

    @PostMapping("/sync-excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<String>> syncFromExcel(
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getMonthValue()}") int month,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int year) {
        leaveExcelService.initFromExcel(month, year);
        return ResponseEntity.ok(APIResponse.success("Leave data synced from Excel"));
    }

    @PostMapping("/export-excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<Resource> exportToExcel(
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getMonthValue()}") int month,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int year) {
        leaveExcelService.syncFromDbToExcel(month, year);
        File file = new File("H:\\PARIKAR\\docs\\Leve details format.xlsx");
        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Leve_details_format.xlsx")
            .body(resource);
    }

    @PostMapping("/upload-excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<String>> uploadExcel(
            @RequestParam MultipartFile file,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getMonthValue()}") int month,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int year) {
        String path = "H:\\PARIKAR\\docs\\Leve details format.xlsx";
        try (InputStream is = file.getInputStream();
             FileOutputStream fos = new FileOutputStream(path)) {
            is.transferTo(fos);
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body(APIResponse.error("Failed to upload Excel: " + e.getMessage()));
        }
        leaveExcelService.initFromExcel(month, year);
        return ResponseEntity.ok(APIResponse.success("Excel uploaded and synced to database"));
    }

    @PostMapping("/credit-monthly")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<String>> creditMonthlyLeave(
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getMonthValue()}") int month,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int year) {
        leaveExcelService.creditMonthlyLeave(month, year);
        return ResponseEntity.ok(APIResponse.success("Monthly leave credited to eligible employees"));
    }

    @GetMapping("/download-excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<Resource> downloadExcel() {
        File file = new File("H:\\PARIKAR\\docs\\Leve details format.xlsx");
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Leve_details_format.xlsx")
            .body(resource);
    }

    @GetMapping("/download-sample-excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<Resource> downloadSampleExcel(
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getMonthValue()}") int month,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int year) {
        leaveExcelService.createSampleSheet(month, year);
        File file = new File("H:\\PARIKAR\\docs\\Leve details format_sample.xlsx");
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Leave_Sample_Format.xlsx")
            .body(resource);
    }

    @DeleteMapping("/clear")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<String>> clearAllBalances() {
        leaveService.clearAllLeaveBalances();
        return ResponseEntity.ok(APIResponse.<String>success("All leave balances cleared successfully", null));
    }
}
