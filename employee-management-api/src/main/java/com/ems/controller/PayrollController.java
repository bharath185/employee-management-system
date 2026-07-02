package com.ems.controller;

import com.ems.dto.*;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.Employee;
import com.ems.repository.EmployeeRepository;
import com.ems.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Month;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;
    private final PayslipService payslipService;
    private final EmailConfigService emailConfigService;
    private final PayrollExportService payrollExportService;
    private final EmployeeRepository employeeRepository;

    // ==================== PAYROLL PROCESSING ====================

    @PostMapping("/process/{year}/{month}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<PayrollProcessDTO>> processPayroll(
            @PathVariable Integer year, @PathVariable Integer month) {
        PayrollProcessDTO result = payrollService.processPayroll(year, month);
        return ResponseEntity.ok(APIResponse.success("Payroll processed successfully", result));
    }

    @GetMapping("/process/status/{year}/{month}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<PayrollProcessDTO>> getPayrollStatus(
            @PathVariable Integer year, @PathVariable Integer month) {
        return ResponseEntity.ok(APIResponse.success(payrollService.getPayrollStatus(year, month)));
    }

    @GetMapping("/process/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<PayrollProcessDTO>>> getPayrollHistory(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(APIResponse.success(payrollService.getPayrollHistory(year, month)));
    }

    // ==================== PAYSLIPS ====================

    @GetMapping("/payslips/{year}/{month}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<PayslipDTO>>> getPayslips(
            @PathVariable Integer year, @PathVariable Integer month) {
        return ResponseEntity.ok(APIResponse.success(payslipService.getPayslips(year, month)));
    }

    @GetMapping("/payslips/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<PayslipDTO>> getPayslipById(@PathVariable Long id) {
        return ResponseEntity.ok(APIResponse.success(payslipService.getPayslipById(id)));
    }

    @GetMapping("/payslips/{id}/html")
    public ResponseEntity<String> getPayslipHtml(@PathVariable Long id) {
        String html = payslipService.getPayslipHtml(id);
        return ResponseEntity.ok()
            .contentType(MediaType.TEXT_HTML)
            .body(html);
    }

    @GetMapping("/payslips/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR') or #employeeId == authentication.principal.employeeId")
    public ResponseEntity<APIResponse<List<PayslipDTO>>> getEmployeePayslips(@PathVariable Long employeeId) {
        return ResponseEntity.ok(APIResponse.success(payslipService.getEmployeePayslips(employeeId)));
    }

    // ==================== SEND PAYSLIPS ====================

    @PostMapping("/send-payslips/{year}/{month}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Map<String, Object>>> sendPayslipsByEmail(
            @PathVariable Integer year, @PathVariable Integer month) {
        List<PayslipDTO> payslips = payslipService.getPayslips(year, month);
        int total = payslips.size();
        int sent = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();

        for (PayslipDTO dto : payslips) {
            try {
                // Look up employee email
                Employee emp = employeeRepository.findById(dto.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + dto.getEmployeeId()));

                if (emp.getEmail() == null || emp.getEmail().isBlank()) {
                    errors.add("No email for employee: " + dto.getEmployeeCode());
                    failed++;
                    continue;
                }

                // Generate HTML payslip
                String html = payslipService.getPayslipHtml(dto.getId());
                String monthName = Month.of(dto.getWageMonth()).name();
                monthName = monthName.charAt(0) + monthName.substring(1).toLowerCase();
                String subject = "Payslip - " + monthName + " " + dto.getWageYear();

                // Send email
                emailConfigService.sendEmail(emp.getEmail(), subject, html);

                // Mark payslip as sent
                payslipService.markAsSent(dto.getId());
                sent++;
            } catch (Exception e) {
                log.error("Failed to send payslip {}: {}", dto.getId(), e.getMessage());
                failed++;
                errors.add("Payslip " + dto.getId() + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = Map.of(
            "total", total,
            "sent", sent,
            "failed", failed,
            "errors", errors
        );
        return ResponseEntity.ok(APIResponse.success("Payslip emails processed", result));
    }

    // ==================== EMAIL CONFIG ====================

    @GetMapping("/email-config")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<EmailConfigDTO>> getEmailConfig() {
        return ResponseEntity.ok(APIResponse.success(emailConfigService.getConfig()));
    }

    @PutMapping("/email-config")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<EmailConfigDTO>> saveEmailConfig(@Valid @RequestBody EmailConfigDTO dto) {
        return ResponseEntity.ok(APIResponse.success("Email configuration saved", emailConfigService.saveConfig(dto)));
    }

    @PostMapping("/email-config/test")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<String>> testEmailConfig() {
        boolean success = emailConfigService.testConnection();
        if (success) {
            return ResponseEntity.ok(APIResponse.success("SMTP connection successful"));
        }
        return ResponseEntity.ok(APIResponse.success("SMTP connection test completed"));
    }

    // ==================== PAYROLL INPUTS (Batch Upsert) ====================

    @PostMapping("/inputs/batch")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Map<String, Object>>> batchUpsertPayrollInputs(
            @Valid @RequestBody PayrollInputDTO payrollInputDTO) {
        if (payrollInputDTO.getInputs() == null || payrollInputDTO.getInputs().isEmpty()) {
            return ResponseEntity.badRequest().body(APIResponse.error("No inputs provided"));
        }
        Map<String, Object> result = payrollService.batchUpsertPayrollInputs(payrollInputDTO.getInputs());
        return ResponseEntity.ok(APIResponse.success("Payroll inputs processed", result));
    }

    // ==================== EXPORTS ====================

    @GetMapping("/export/bank-file/{year}/{month}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> downloadBankFile(
            @PathVariable Integer year, @PathVariable Integer month) {
        return payrollExportService.exportBankFile(year, month);
    }

    @GetMapping("/export/report/{year}/{month}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> downloadPayrollReport(
            @PathVariable Integer year, @PathVariable Integer month) {
        return payrollExportService.exportPayrollReport(year, month);
    }

    // ==================== STATS ====================

    @GetMapping("/stats/{year}/{month}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Map<String, Object>>> getPayslipStats(
            @PathVariable Integer year, @PathVariable Integer month) {
        return ResponseEntity.ok(APIResponse.success(payslipService.getPayslipStats(year, month)));
    }
}
