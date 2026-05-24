package com.ems.service;

import com.ems.dto.DocumentDownloadLogDTO;
import com.ems.dto.DocumentTemplateDTO;
import com.ems.dto.DownloadStatsDTO;
import com.ems.dto.TemplateGenerateRequest;
import com.ems.exception.BadRequestException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.Company;
import com.ems.model.DocumentDownloadLog;
import com.ems.model.DocumentTemplate;
import com.ems.model.Employee;
import com.ems.repository.DocumentDownloadLogRepository;
import com.ems.repository.DocumentTemplateRepository;
import com.ems.repository.EmployeeRepository;
import com.ems.utils.TemplateEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentTemplateService {

    private final DocumentTemplateRepository templateRepository;
    private final DocumentDownloadLogRepository downloadLogRepository;
    private final EmployeeRepository employeeRepository;
    private final CompanyService companyService;

    // ========== TEMPLATE CRUD ==========

    public Page<DocumentTemplateDTO> getAllTemplates(String templateType, Boolean active, Pageable pageable) {
        Page<DocumentTemplate> templates;

        if (templateType != null && !templateType.isEmpty() && active != null) {
            templates = templateRepository.findByTemplateTypeAndIsActive(templateType, active, pageable);
        } else if (templateType != null && !templateType.isEmpty()) {
            templates = templateRepository.findByTemplateType(templateType, pageable);
        } else if (active != null) {
            templates = templateRepository.findByIsActive(active, pageable);
        } else {
            templates = templateRepository.findAll(pageable);
        }

        return templates.map(DocumentTemplateDTO::fromEntity);
    }

    public DocumentTemplateDTO getTemplateById(Long id) {
        DocumentTemplate template = templateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Document template not found with id: " + id));
        return DocumentTemplateDTO.fromEntity(template);
    }

    @Transactional
    public DocumentTemplateDTO createTemplate(DocumentTemplateDTO dto, String username) {
        if (dto.getTemplateName() == null || dto.getTemplateName().trim().isEmpty()) {
            throw new BadRequestException("Template name is required");
        }
        if (dto.getTemplateType() == null || dto.getTemplateType().trim().isEmpty()) {
            throw new BadRequestException("Template type is required");
        }
        if (dto.getContent() == null || dto.getContent().trim().isEmpty()) {
            throw new BadRequestException("Template content is required");
        }

        DocumentTemplate template = dto.toEntity();
        template.setCreatedBy(username);
        template.setUpdatedBy(username);
        if (template.getIsActive() == null) {
            template.setIsActive(true);
        }

        DocumentTemplate saved = templateRepository.save(template);
        log.info("Document template created: {} by {}", saved.getTemplateName(), username);
        return DocumentTemplateDTO.fromEntity(saved);
    }

    @Transactional
    public DocumentTemplateDTO updateTemplate(Long id, DocumentTemplateDTO dto, String username) {
        DocumentTemplate existing = templateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Document template not found with id: " + id));

        if (dto.getTemplateName() != null) {
            existing.setTemplateName(dto.getTemplateName());
        }
        if (dto.getTemplateType() != null) {
            existing.setTemplateType(dto.getTemplateType());
        }
        if (dto.getDescription() != null) {
            existing.setDescription(dto.getDescription());
        }
        if (dto.getContent() != null) {
            existing.setContent(dto.getContent());
        }
        if (dto.getVariables() != null) {
            existing.setVariables(dto.getVariables());
        }
        if (dto.getIsActive() != null) {
            existing.setIsActive(dto.getIsActive());
        }
        existing.setUpdatedBy(username);

        DocumentTemplate saved = templateRepository.save(existing);
        log.info("Document template updated: {} by {}", saved.getTemplateName(), username);
        return DocumentTemplateDTO.fromEntity(saved);
    }

    @Transactional
    public void deactivateTemplate(Long id, String username) {
        DocumentTemplate template = templateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Document template not found with id: " + id));

        template.setIsActive(false);
        template.setUpdatedBy(username);
        templateRepository.save(template);
        log.info("Document template deactivated: {} by {}", template.getTemplateName(), username);
    }

    // ========== DOCUMENT GENERATION ==========

    /**
     * Generate a filled document for preview (no download log).
     */
    public String previewDocument(Long templateId, Long employeeId) {
        DocumentTemplate template = templateRepository.findById(templateId)
            .orElseThrow(() -> new ResourceNotFoundException("Document template not found with id: " + templateId));

        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        Company company = companyService.getCompany();

        String filledContent = TemplateEngine.process(template.getContent(), employee, company);
        String styledHtml = wrapWithPrintStyles(filledContent, template.getTemplateName());

        log.debug("Document preview generated for template: {}, employee: {}", templateId, employeeId);
        return styledHtml;
    }

    /**
     * Generate a filled document and log the download.
     */
    @Transactional
    public String generateAndLogDocument(Long templateId, Long employeeId, String downloadedBy) {
        DocumentTemplate template = templateRepository.findById(templateId)
            .orElseThrow(() -> new ResourceNotFoundException("Document template not found with id: " + templateId));

        if (!template.getIsActive()) {
            throw new BadRequestException("Template is not active: " + template.getTemplateName());
        }

        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        Company company = companyService.getCompany();

        String filledContent = TemplateEngine.process(template.getContent(), employee, company);
        String styledHtml = wrapWithPrintStyles(filledContent, template.getTemplateName());

        // Log the download
        String financialYear = calculateFinancialYear();
        DocumentDownloadLog logEntry = DocumentDownloadLog.builder()
            .employeeId(employeeId)
            .templateId(templateId)
            .financialYear(financialYear)
            .downloadedAt(LocalDateTime.now())
            .downloadedBy(downloadedBy)
            .build();

        downloadLogRepository.save(logEntry);
        log.info("Document generated and logged: template={}, employee={}, fy={}, by={}",
            templateId, employeeId, financialYear, downloadedBy);

        return styledHtml;
    }

    // ========== DOWNLOAD LOGS ==========

    public Page<DocumentDownloadLogDTO> getDownloadLogs(
            Long employeeId, Long templateId, String financialYear,
            int page, int size, String sort) {

        Sort sorting = Sort.by(sort.contains("desc") ? Sort.Direction.DESC : Sort.Direction.ASC,
            sort.split(",")[0]);
        Pageable pageable = PageRequest.of(page, size, sorting);
        Page<DocumentDownloadLog> logs;

        if (employeeId != null && templateId != null && financialYear != null) {
            logs = downloadLogRepository.findByEmployeeIdAndTemplateIdAndFinancialYear(
                employeeId, templateId, financialYear, pageable);
        } else if (employeeId != null && templateId != null) {
            logs = downloadLogRepository.findByEmployeeIdAndTemplateId(employeeId, templateId, pageable);
        } else if (employeeId != null && financialYear != null) {
            logs = downloadLogRepository.findByEmployeeIdAndFinancialYear(employeeId, financialYear, pageable);
        } else if (templateId != null && financialYear != null) {
            logs = downloadLogRepository.findByTemplateIdAndFinancialYear(templateId, financialYear, pageable);
        } else if (employeeId != null) {
            logs = downloadLogRepository.findByEmployeeId(employeeId, pageable);
        } else if (templateId != null) {
            logs = downloadLogRepository.findByTemplateId(templateId, pageable);
        } else if (financialYear != null) {
            logs = downloadLogRepository.findByFinancialYear(financialYear, pageable);
        } else {
            logs = downloadLogRepository.findAll(pageable);
        }

        return logs.map(DocumentDownloadLogDTO::fromEntity);
    }

    /**
     * Get download stats: per employee, per template, per financial year.
     */
    public DownloadStatsDTO getDownloadStats() {
        List<Map<String, Object>> perEmployee = new ArrayList<>();
        for (Object[] row : downloadLogRepository.countByEmployeeId()) {
            Map<String, Object> item = new HashMap<>();
            item.put("employeeId", row[0]);
            item.put("count", row[1]);
            perEmployee.add(item);
        }

        List<Map<String, Object>> perTemplate = new ArrayList<>();
        for (Object[] row : downloadLogRepository.countByTemplateId()) {
            Map<String, Object> item = new HashMap<>();
            item.put("templateId", row[0]);
            item.put("count", row[1]);
            perTemplate.add(item);
        }

        List<Map<String, Object>> perFinancialYear = new ArrayList<>();
        for (Object[] row : downloadLogRepository.countByFinancialYear()) {
            Map<String, Object> item = new HashMap<>();
            item.put("financialYear", row[0]);
            item.put("count", row[1]);
            perFinancialYear.add(item);
        }

        return DownloadStatsDTO.builder()
            .perEmployee(perEmployee)
            .perTemplate(perTemplate)
            .perFinancialYear(perFinancialYear)
            .build();
    }

    /**
     * Get download history for a specific employee.
     */
    public List<DocumentDownloadLogDTO> getEmployeeDownloadLogs(Long employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Employee not found with id: " + employeeId);
        }
        return downloadLogRepository.findByEmployeeIdOrderByDownloadedAtDesc(employeeId)
            .stream()
            .map(DocumentDownloadLogDTO::fromEntity)
            .collect(Collectors.toList());
    }

    /**
     * Get distinct financial years.
     */
    public List<String> getFinancialYears() {
        return downloadLogRepository.findDistinctFinancialYears();
    }

    // ========== ENUM VALUES ==========

    public List<Map<String, String>> getTemplateTypes() {
        List<Map<String, String>> types = new ArrayList<>();
        types.add(createType("JOINING_LETTER", "Joining Letter"));
        types.add(createType("RELIEVING_LETTER", "Relieving Letter"));
        types.add(createType("EXPERIENCE_LETTER", "Experience Letter"));
        types.add(createType("OFFER_LETTER", "Offer Letter"));
        types.add(createType("APPOINTMENT_LETTER", "Appointment Letter"));
        types.add(createType("SALARY_SLIP", "Salary Slip"));
        types.add(createType("CONFIRMATION_LETTER", "Confirmation Letter"));
        types.add(createType("TRANSFER_LETTER", "Transfer Letter"));
        types.add(createType("PROMOTION_LETTER", "Promotion Letter"));
        types.add(createType("WARNING_LETTER", "Warning Letter"));
        types.add(createType("SHOW_CAUSE", "Show Cause Notice"));
        types.add(createType("NOC", "No Objection Certificate"));
        types.add(createType("BONUS_LETTER", "Bonus Letter"));
        types.add(createType("INCREMENT_LETTER", "Increment Letter"));
        types.add(createType("OTHER", "Other"));
        return types;
    }

    // ========== PRIVATE HELPERS ==========

    /**
     * Calculate financial year: Apr-Mar.
     * If month >= 4, year = "YYYY-YYYY+1", else "YYYY-1-YYYY".
     */
    private String calculateFinancialYear() {
        LocalDate today = LocalDate.now();
        int year = today.getYear();
        int month = today.getMonthValue();
        if (month >= 4) {
            return year + "-" + (year + 1);
        } else {
            return (year - 1) + "-" + year;
        }
    }

    /**
     * Wraps the filled HTML content with proper print-friendly styling.
     */
    private String wrapWithPrintStyles(String content, String title) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>%s</title>
                <style>
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        font-size: 12pt;
                        line-height: 1.6;
                        color: #333;
                    }
                    .document-header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .document-header h1 {
                        font-size: 18pt;
                        text-decoration: underline;
                        margin-bottom: 5px;
                    }
                    .document-content {
                        text-align: justify;
                    }
                    .document-content p {
                        margin-bottom: 10px;
                    }
                    .signature-section {
                        margin-top: 50px;
                    }
                    .signature-section .signature-line {
                        margin-top: 60px;
                    }
                    @media print {
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                %s
            </body>
            </html>
            """.formatted(escapeHtml(title), content);
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }

    private Map<String, String> createType(String code, String display) {
        Map<String, String> entry = new HashMap<>();
        entry.put("code", code);
        entry.put("display", display);
        return entry;
    }
}
