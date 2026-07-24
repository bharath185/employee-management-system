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
import org.springframework.web.multipart.MultipartFile;

import java.text.NumberFormat;
import java.time.Month;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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
    private final CompanyService companyService;

    // ==================== PAYROLL UPLOAD (Excel) ====================

    @PostMapping("/upload/{year}/{month}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Map<String, Object>>> uploadSalaryStatement(
            @PathVariable Integer year, @PathVariable Integer month,
            @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(APIResponse.error("No file uploaded"));
        }
        Map<String, Object> result = payrollService.uploadSalaryStatement(file, year, month);
        return ResponseEntity.ok(APIResponse.success("Salary statement uploaded and processed", result));
    }

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

    @GetMapping("/payslips/{id}/pdf")
    public ResponseEntity<byte[]> getPayslipPdf(@PathVariable Long id) {
        byte[] pdf = payslipService.generatePayslipPdf(id);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header("Content-Disposition", "attachment; filename=payslip_" + id + ".pdf")
            .body(pdf);
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
                // Generate PDF payslip for attachment
                byte[] pdf = payslipService.generatePayslipPdf(dto.getId());
                String monthName = Month.of(dto.getWageMonth()).name();
                monthName = monthName.charAt(0) + monthName.substring(1).toLowerCase();
                String subject = "Payslip - " + monthName + " " + dto.getWageYear();
                String pdfName = "Payslip_" + dto.getEmployeeCode() + "_" + monthName + "_" + dto.getWageYear() + ".pdf";

                // Professional email body
                String emailBody = String.format("""
                    <!DOCTYPE html>
                    <html><head><meta charset="UTF-8">
                    <style>
                      body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f7fa;padding:20px;}
                      .container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);}
                      .header{background:#1a3a6b;padding:20px;text-align:center;}
                      .header h1{color:#fff;margin:0;font-size:18px;}
                      .body{padding:24px;}
                      .body p{color:#333;font-size:14px;line-height:1.6;margin:0 0 12px;}
                      .btn{display:inline-block;background:#1a3a6b;color:#fff;padding:10px 24px;border-radius:4px;text-decoration:none;font-size:14px;margin:8px 0;}
                      .footer{border-top:1px solid #e0e0e0;padding:16px 24px;text-align:center;font-size:12px;color:#888;}
                      .highlight{font-weight:700;color:#1a3a6b;}
                    </style></head><body>
                    <div class="container">
                      <div class="header"><h1>Payslip - %s %s</h1></div>
                      <div class="body">
                        <p>Dear <span class="highlight">%s</span>,</p>
                        <p>Your payslip for the month of <strong>%s %s</strong> has been generated.</p>
                        <p style="text-align:center;font-size:24px;font-weight:700;color:#1a3a6b;">INR %s</p>
                        <p style="text-align:center;">Net Pay</p>
                        <p>The PDF payslip is attached for your reference. Please review the details and reach out to HR if you have any questions.</p>
                      </div>
                      <div class="footer">
                        <p>This is an auto-generated email from %s. Please do not reply.</p>
                      </div>
                    </div>
                    </body></html>
                    """,
                    monthName, dto.getWageYear(),
                    dto.getEmployeeName(),
                    monthName, dto.getWageYear(),
                    NumberFormat.getNumberInstance(Locale.US).format(dto.getNetPay()),
                    companyService.getCompany().getCompanyName()
                );

                // Send email with PDF attachment
                emailConfigService.sendEmailWithAttachment(emp.getEmail(), subject, emailBody, pdf, pdfName);

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

    @GetMapping("/export/statement/{year}/{month}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> exportSalaryStatement(
            @PathVariable Integer year, @PathVariable Integer month) {
        return payrollExportService.exportSalaryStatement(year, month);
    }

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

    @GetMapping("/export/sample-statement")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> downloadSampleStatement() {
        return payrollExportService.generateSampleStatement();
    }

    // ==================== STATS ====================

    @GetMapping("/stats/{year}/{month}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Map<String, Object>>> getPayslipStats(
            @PathVariable Integer year, @PathVariable Integer month) {
        return ResponseEntity.ok(APIResponse.success(payslipService.getPayslipStats(year, month)));
    }

    // ==================== DELETE PAYSLIPS (allow re-process) ====================

    @DeleteMapping("/payslips/{year}/{month}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Integer>> deletePayslipsByPeriod(
            @PathVariable Integer year, @PathVariable Integer month) {
        int deleted = payslipService.deletePayslipsByPeriod(year, month);
        payrollService.deleteProcessRecord(year, month);
        return ResponseEntity.ok(APIResponse.success(
            deleted + " payslip(s) deleted. Ready to re-process.", deleted));
    }
}
