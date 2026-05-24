package com.ems.controller;

import com.ems.dto.*;
import com.ems.security.CustomUserDetails;
import com.ems.service.DocumentTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/document-templates")
@RequiredArgsConstructor
public class DocumentTemplateController {

    private final DocumentTemplateService documentTemplateService;

    // ========== TEMPLATE CRUD ==========

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<List<DocumentTemplateDTO>>> getAllTemplates(
            @RequestParam(required = false) String templateType,
            @RequestParam(required = false) Boolean active) {
        List<DocumentTemplateDTO> templates = documentTemplateService.getAllTemplates(templateType, active);
        return ResponseEntity.ok(APIResponse.success(templates));
    }

    @GetMapping("/types")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<List<Map<String, String>>>> getTemplateTypes() {
        List<Map<String, String>> types = documentTemplateService.getTemplateTypes();
        return ResponseEntity.ok(APIResponse.success(types));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<DocumentTemplateDTO>> getTemplateById(@PathVariable Long id) {
        DocumentTemplateDTO template = documentTemplateService.getTemplateById(id);
        return ResponseEntity.ok(APIResponse.success(template));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<DocumentTemplateDTO>> createTemplate(
            @RequestBody DocumentTemplateDTO dto,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        DocumentTemplateDTO created = documentTemplateService.createTemplate(dto, currentUser.getUsername());
        return ResponseEntity.ok(APIResponse.success("Template created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<DocumentTemplateDTO>> updateTemplate(
            @PathVariable Long id,
            @RequestBody DocumentTemplateDTO dto,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        DocumentTemplateDTO updated = documentTemplateService.updateTemplate(id, dto, currentUser.getUsername());
        return ResponseEntity.ok(APIResponse.success("Template updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Void>> deactivateTemplate(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        documentTemplateService.deactivateTemplate(id, currentUser.getUsername());
        return ResponseEntity.ok(APIResponse.success("Template deactivated successfully", null));
    }

    // ========== DOCUMENT GENERATION & DOWNLOAD ==========

    @PostMapping("/{id}/generate/{employeeId}")
    public ResponseEntity<APIResponse<Map<String, String>>> generateDocument(
            @PathVariable Long id,
            @PathVariable Long employeeId,
            @RequestParam(defaultValue = "pdf") String format,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        // EMPLOYEE role can only generate their own documents
        if (currentUser.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))
                && !currentUser.getEmployeeId().equals(employeeId)) {
            return ResponseEntity.status(403)
                .body(APIResponse.error("Access denied"));
        }

        String filledHtml = documentTemplateService.generateAndLogDocument(
            id, employeeId, currentUser.getUsername());

        Map<String, String> response = Map.of(
            "html", filledHtml,
            "format", format,
            "message", "Document generated successfully. Use window.print() or a PDF library to convert to PDF."
        );

        return ResponseEntity.ok(APIResponse.success("Document generated successfully", response));
    }

    @GetMapping("/preview/{id}")
    public ResponseEntity<APIResponse<String>> previewDocument(
            @PathVariable Long id,
            @RequestParam Long employeeId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        // EMPLOYEE role can only preview their own documents
        if (currentUser.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))
                && !currentUser.getEmployeeId().equals(employeeId)) {
            return ResponseEntity.status(403)
                .body(APIResponse.error("Access denied"));
        }

        String filledHtml = documentTemplateService.previewDocument(id, employeeId);
        return ResponseEntity.ok(APIResponse.success(filledHtml));
    }

    // ========== DOWNLOAD TRACKING ==========

    @GetMapping("/download-logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<PagedResponse<DocumentDownloadLogDTO>>> getDownloadLogs(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long templateId,
            @RequestParam(required = false) String financialYear,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "downloadedAt,desc") String sort) {

        Page<DocumentDownloadLogDTO> logsPage = documentTemplateService.getDownloadLogs(
            employeeId, templateId, financialYear, page, size, sort);

        PagedResponse<DocumentDownloadLogDTO> paged = PagedResponse.<DocumentDownloadLogDTO>builder()
            .content(logsPage.getContent())
            .page(logsPage.getNumber())
            .size(logsPage.getSize())
            .totalElements(logsPage.getTotalElements())
            .totalPages(logsPage.getTotalPages())
            .first(logsPage.isFirst())
            .last(logsPage.isLast())
            .build();

        return ResponseEntity.ok(APIResponse.success(paged));
    }

    @GetMapping("/download-logs/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<DownloadStatsDTO>> getDownloadStats() {
        DownloadStatsDTO stats = documentTemplateService.getDownloadStats();
        return ResponseEntity.ok(APIResponse.success(stats));
    }

    @GetMapping("/download-logs/employee/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<List<DocumentDownloadLogDTO>>> getEmployeeDownloadLogs(
            @PathVariable Long employeeId) {
        List<DocumentDownloadLogDTO> logs = documentTemplateService.getEmployeeDownloadLogs(employeeId);
        return ResponseEntity.ok(APIResponse.success(logs));
    }

    @GetMapping("/download-logs/financial-years")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<List<String>>> getFinancialYears() {
        List<String> years = documentTemplateService.getFinancialYears();
        return ResponseEntity.ok(APIResponse.success(years));
    }
}
