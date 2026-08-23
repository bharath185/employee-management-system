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
import com.ems.model.Salary;
import com.ems.model.SalaryMaster;
import com.ems.repository.DocumentDownloadLogRepository;
import com.ems.repository.DocumentTemplateRepository;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.SalaryRepository;
import com.ems.repository.SalaryMasterRepository;
import com.ems.utils.TemplateEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentTemplateService {

    private final DocumentTemplateRepository templateRepository;
    private final DocumentDownloadLogRepository downloadLogRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryRepository salaryRepository;
    private final SalaryMasterRepository salaryMasterRepository;
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
        filledContent = resolveLogoUrl(filledContent, company);
        filledContent = resolveSalaryPlaceholders(filledContent, employee);
        String styledHtml = wrapWithPrintStyles(filledContent, template.getTemplateName());
        styledHtml = applyA4PreviewFrame(styledHtml);

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
        filledContent = resolveLogoUrl(filledContent, company);
        filledContent = resolveSalaryPlaceholders(filledContent, employee);
        String styledHtml = wrapWithPrintStyles(filledContent, template.getTemplateName());
        styledHtml = applyA4PreviewFrame(styledHtml);

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
        types.add(createType("REFERENCE_CHECK", "Reference Check Call Record"));
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
     * Resolves salary-related placeholders ({{basic_pay}}, {{hra_amount}}, etc.)
     * using the employee's most recent salary record.
     */
    private String resolveSalaryPlaceholders(String content, Employee employee) {
        if (employee == null || employee.getId() == null) return content;

        Map<String, String> salaryValues = new HashMap<>();

        try {
            BigDecimal basic = BigDecimal.ZERO;
            BigDecimal hra = BigDecimal.ZERO;
            BigDecimal fpa = BigDecimal.ZERO;
            BigDecimal oa = BigDecimal.ZERO;
            BigDecimal pf = BigDecimal.ZERO;
            BigDecimal esi = BigDecimal.ZERO;
            BigDecimal pt = BigDecimal.ZERO;
            BigDecimal health = BigDecimal.ZERO;
            boolean found = false;

            // 1. First check recent monthly Salary
            List<Salary> salaries = salaryRepository.findByEmployeeId(employee.getId());
            if (salaries != null && !salaries.isEmpty()) {
                salaries.sort((a, b) -> {
                    int y = b.getWageYear().compareTo(a.getWageYear());
                    return y != 0 ? y : b.getWageMonth().compareTo(a.getWageMonth());
                });
                Salary s = salaries.get(0);
                basic = safe(s.getBasic());
                hra = safe(s.getHra());
                fpa = safe(s.getFixedPersonalAllowance());
                oa = safe(s.getOtherAllowance());
                pf = safe(s.getPfDeduction());
                esi = safe(s.getEsiDeduction());
                pt = safe(s.getPtDeduction());
                health = safe(s.getHealthInsurance());
                if (basic.compareTo(BigDecimal.ZERO) > 0 || hra.compareTo(BigDecimal.ZERO) > 0) {
                    found = true;
                }
            }

            // 2. Fall back to SalaryMaster if no monthly salary or basic was 0
            if (!found) {
                Optional<SalaryMaster> smOpt = salaryMasterRepository.findByEmployeeId(employee.getId());
                if (smOpt.isPresent()) {
                    SalaryMaster sm = smOpt.get();
                    basic = safe(sm.getBasic());
                    hra = safe(sm.getHra());
                    fpa = safe(sm.getFixedPersonalAllowance());
                    oa = safe(sm.getOtherAllowance());
                    pf = safe(sm.getPfDeduction());
                    esi = safe(sm.getEsiDeduction());
                    pt = safe(sm.getPtDeduction());
                    health = safe(sm.getHealthInsurance());
                    found = true;
                }
            }

            if (found) {
                BigDecimal grossMonthly = basic.add(hra).add(fpa).add(oa);
                BigDecimal grossAnnual = grossMonthly.multiply(BigDecimal.valueOf(12));
                BigDecimal totalDeductionsMonthly = pf.add(esi).add(pt).add(health);
                BigDecimal netMonthly = grossMonthly.subtract(totalDeductionsMonthly);
                if (netMonthly.compareTo(BigDecimal.ZERO) < 0) netMonthly = BigDecimal.ZERO;
                BigDecimal netAnnual = netMonthly.multiply(BigDecimal.valueOf(12));
                BigDecimal ctcMonthly = grossMonthly.add(pf).add(esi);
                BigDecimal ctcAnnual = ctcMonthly.multiply(BigDecimal.valueOf(12));

                salaryValues.put("basic_pay", fmt(basic));
                salaryValues.put("basic_pay_annual", fmt(basic.multiply(BigDecimal.valueOf(12))));
                salaryValues.put("hra_amount", fmt(hra));
                salaryValues.put("hra_annual", fmt(hra.multiply(BigDecimal.valueOf(12))));
                salaryValues.put("fixed_personal_allowance", fmt(fpa));
                salaryValues.put("fpa_amount", fmt(fpa));
                salaryValues.put("other_allowance", fmt(oa));
                salaryValues.put("other_allowance_annual", fmt(oa.multiply(BigDecimal.valueOf(12))));
                salaryValues.put("gross_salary", fmt(grossMonthly));
                salaryValues.put("gross_salary_annual", fmt(grossAnnual));
                salaryValues.put("total_monthly", fmt(grossMonthly));
                salaryValues.put("total_annual", fmt(grossAnnual));
                salaryValues.put("pf_amount", fmt(pf));
                salaryValues.put("pf_annual", fmt(pf.multiply(BigDecimal.valueOf(12))));
                salaryValues.put("esic_amount", fmt(esi));
                salaryValues.put("esic_annual", fmt(esi.multiply(BigDecimal.valueOf(12))));
                salaryValues.put("pt_amount", fmt(pt));
                salaryValues.put("pt_annual", fmt(pt.multiply(BigDecimal.valueOf(12))));
                salaryValues.put("health_insurance", fmt(health));
                salaryValues.put("health_insurance_annual", fmt(health.multiply(BigDecimal.valueOf(12))));
                salaryValues.put("net_pay", fmt(netMonthly));
                salaryValues.put("net_salary", fmt(netMonthly));
                salaryValues.put("in_hand_salary", fmt(netMonthly));
                salaryValues.put("net_pay_annual", fmt(netAnnual));
                salaryValues.put("ctc_monthly", fmt(ctcMonthly));
                salaryValues.put("ctc_annual", fmt(ctcAnnual));
            }
        } catch (Exception e) {
            log.debug("Could not resolve salary placeholders for employee {}: {}", employee.getId(), e.getMessage());
        }

        return salaryValues.isEmpty() ? content : TemplateEngine.processWithMap(content, salaryValues);
    }

    private BigDecimal safe(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    private String fmt(BigDecimal val) {
        return "\u20B9 " + val.setScale(2, RoundingMode.HALF_UP).toString();
    }

    /**
     * Resolves the {{company_logo}} placeholder with an absolute URL
     */
    private String resolveLogoUrl(String content, Company company) {
        if (content == null || content.isEmpty()) return content;
        String logoSrc = "";
        if (company != null && company.getLogoPath() != null && !company.getLogoPath().isEmpty()) {
            try {
                Path logoPath = companyService.getLogoFilePath();
                byte[] bytes = Files.readAllBytes(logoPath);
                String mime = Files.probeContentType(logoPath);
                if (mime == null || mime.isBlank()) {
                    String name = logoPath.getFileName().toString().toLowerCase();
                    mime = name.endsWith(".png") ? "image/png"
                        : name.endsWith(".gif") ? "image/gif"
                        : name.endsWith(".webp") ? "image/webp"
                        : "image/jpeg";
                }
                logoSrc = "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
            } catch (Exception e) {
                log.warn("Could not embed company logo: {}", e.getMessage());
                logoSrc = "";
            }
        }
        return content.replace("{{company_logo}}", logoSrc);
    }

    /**
     * Forces the same A4 paper size in on-screen preview, print window, and PDF print.
     */
    private String applyA4PreviewFrame(String html) {
        if (html == null || html.contains("id=\"ems-a4-frame\"")) {
            return html;
        }
        String frame = """
            <style id="ems-a4-frame">
              @page {
                size: A4 portrait;
                margin: 12mm 15mm 12mm 15mm;
              }
              *, *::before, *::after {
                box-sizing: border-box;
              }
              @media screen {
                html {
                  background: #cfd5de !important;
                }
                body {
                  background: #cfd5de !important;
                  margin: 0 !important;
                  padding: 24px 0 32px !important;
                  display: flex !important;
                  flex-direction: column !important;
                  align-items: center !important;
                  min-height: 100vh !important;
                  box-sizing: border-box !important;
                }
                body > :first-child {
                  width: 210mm !important;
                  max-width: 210mm !important;
                  min-height: 297mm;
                  margin: 0 auto !important;
                  background: #ffffff !important;
                  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.18) !important;
                  border-radius: 4px !important;
                  box-sizing: border-box !important;
                }
              }
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 12mm 15mm 12mm 15mm;
                }
                html, body {
                  background: #ffffff !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  display: block !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body > :first-child {
                  width: 100% !important;
                  max-width: 100% !important;
                  min-height: auto !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                  border-radius: 0 !important;
                  background: #ffffff !important;
                }
              }
            </style>
            """;
        String lower = html.toLowerCase();
        int idx = lower.indexOf("</head>");
        if (idx >= 0) {
            return html.substring(0, idx) + frame + html.substring(idx);
        }
        return frame + html;
    }

    /**
     * Wraps the filled HTML content with proper print-friendly styling.
     */
    private String wrapWithPrintStyles(String content, String title) {
        if (content != null && (content.contains("<!DOCTYPE") || content.contains("<html"))) {
            return content;
        }
        if (content != null && content.contains("joining-a4")) {
            return wrapJoiningA4(content, title);
        }
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>%s</title>
                <style>
                    :root {
                        --navy: #14335e;
                        --navy-deep: #0a1f3d;
                        --gold: #2f6fb0;
                        --gold-light: #6fa4d8;
                        --cream: #f4f7fb;
                        --paper: #fffdfb;
                        --ink: #232833;
                        --ink-soft: #545e6e;
                        --rule: #c9d6e6;
                        --fill-bg: #dfeaf7;
                        --fill-border: #5b8fc7;
                    }

                    @page {
                        size: A4;
                        margin: 14mm 16mm;
                    }

                    body {
                        font-family: 'Times New Roman', Times, serif;
                        font-size: 14.5px;
                        line-height: 1.8;
                        color: var(--ink);
                        background: #fff;
                    }

                    /* ===== generic template styles (salary slip etc.) ===== */
                    .document-header { text-align: center; margin-bottom: 30px; }
                    .document-header h1 { font-size: 18pt; text-decoration: underline; margin-bottom: 5px; }
                    .document-content { text-align: justify; }
                    .document-content p { margin-bottom: 8px; }
                    .signature-section { margin-top: 40px; }

                    /* ===== letterhead ===== */
                    .letterhead {
                        display: flex; align-items: center; justify-content: space-between;
                        padding-bottom: 22px; margin-bottom: 26px;
                        border-bottom: 2px solid var(--navy);
                    }
                    .brand { display: flex; align-items: center; gap: 16px; }
                    .crest {
                        height: 64px; max-width: 200px;
                        flex-shrink: 0; overflow: hidden;
                    }
                    .crest img { height: 64px; width: auto; max-width: 200px; object-fit: contain; display: block; }
                    .crest img[src=""] { display: none; }
                    .brand-text { display: none; }
                    .brand-text .company {
                        font-size: 23px; font-weight: 700; color: var(--navy);
                        letter-spacing: .01em; line-height: 1.15;
                    }
                    .brand-text .tagline {
                        font-size: 11px; letter-spacing: .14em; text-transform: uppercase;
                        color: var(--gold); margin-top: 3px;
                    }
                    .letterhead-meta {
                        text-align: right; font-size: 11.5px; color: var(--ink-soft); line-height: 1.7;
                    }
                    .label-tag {
                        font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase;
                        color: var(--gold); margin-bottom: 4px; display: block;
                    }
                    .header-line { border: none; border-top: 2px solid var(--navy); margin: 8px 0 15px 0; }

                    .confidential {
                        text-align: center; font-size: 11px; letter-spacing: .2em;
                        text-transform: uppercase; color: var(--ink-soft); margin-bottom: 30px;
                    }
                    .doc-date { margin-bottom: 22px; }
                    .addressee { margin-bottom: 26px; line-height: 1.75; }
                    .salutation { margin-bottom: 16px; }

                    h1.title {
                        font-size: 26px; font-weight: 600; color: var(--navy);
                        text-align: center; margin: 8px 0 6px; letter-spacing: .01em;
                    }
                    .title-rule { width: 70px; height: 2px; margin: 0 auto 30px; background: var(--gold); }

                    .closing-note { font-style: italic; color: var(--ink-soft); margin: 22px 0 30px; }

                    .sign-block { margin-top: 30px; page-break-inside: avoid; }
                    .sign-block .for-line { margin-bottom: 46px; }
                    .sign-block .signatory { font-weight: 600; font-size: 14px; }
                    .sign-block .role { font-size: 12.5px; color: var(--ink-soft); margin-top: 2px; }

                    .section-break {
                        display: flex; align-items: center; gap: 14px; margin: 44px 0 24px;
                    }
                    .section-break::before, .section-break::after {
                        content: ""; flex: 1; height: 1px; background: var(--rule);
                    }
                    .section-break .st {
                        font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--gold);
                    }

                    h2.doc-heading {
                        font-weight: 600; font-size: 19px; color: var(--navy);
                        text-align: center; margin: 0 0 4px;
                    }
                    .doc-sub {
                        text-align: center; font-size: 11px; color: var(--ink-soft);
                        letter-spacing: .06em; margin-bottom: 28px;
                    }

                    /* ===== numbered clauses ===== */
                    ol.clauses { list-style: none; counter-reset: clause; padding: 0; margin: 0; }
                    ol.clauses > li {
                        counter-increment: clause;
                        position: relative; padding-left: 40px; margin-bottom: 18px; line-height: 1.8;
                    }
                    ol.clauses > li::before {
                        content: counter(clause);
                        position: absolute; left: 0; top: 1px;
                        width: 26px; height: 26px; border-radius: 50%%;
                        background: var(--navy); color: #fff;
                        font-size: 12px; font-weight: 600;
                        display: flex; align-items: center; justify-content: center;
                    }
                    ol.clauses > li strong.clause-title { color: var(--navy); }

                    ol.sub-list { list-style: lower-alpha; margin: 10px 0 0; padding-left: 22px; }
                    ol.sub-list li { margin-bottom: 8px; line-height: 1.75; }
                    ol.roman-list { list-style: lower-roman; margin: 8px 0 0; padding-left: 22px; }
                    ol.roman-list li { margin-bottom: 7px; line-height: 1.72; color: var(--ink-soft); }

                    /* ===== CTC table ===== */
                    table.ctc {
                        width: 100%%; border-collapse: collapse; margin: 8px 0 22px;
                    }
                    table.ctc caption {
                        text-align: left; font-size: 16px; color: var(--navy);
                        font-weight: 600; margin-bottom: 12px;
                    }
                    table.ctc th {
                        background: var(--navy); color: #fff; text-align: left;
                        padding: 10px 14px; font-weight: 500; letter-spacing: .03em;
                    }
                    table.ctc th:last-child, table.ctc td:last-child { text-align: right; }
                    table.ctc td { padding: 10px 14px; border-bottom: 1px solid var(--rule); }
                    table.ctc tr:nth-child(even) td { background: #f0f4f9; }
                    table.ctc tr.total td {
                        font-weight: 700; color: var(--navy); border-top: 2px solid var(--navy);
                        background: #dce8f5;
                    }

                    .notes-list { margin: 4px 0 0; padding-left: 20px; }
                    .notes-list li { font-size: 13px; color: var(--ink-soft); margin-bottom: 8px; line-height: 1.7; }

                    /* ===== declaration box ===== */
                    .declaration {
                        border: 1.5px solid var(--gold);
                        background: #eef4fa; padding: 30px 34px; border-radius: 4px;
                        position: relative;
                    }
                    .declaration::before {
                        content: "Declaration";
                        position: absolute; top: -13px; left: 28px;
                        background: var(--gold); color: #fff;
                        font-size: 11px; letter-spacing: .14em; text-transform: uppercase;
                        padding: 4px 14px; border-radius: 3px;
                    }
                    .declaration p { font-size: 13.8px; }

                    .sig-grid {
                        display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 36px;
                    }
                    .sig-line { border-bottom: 1.4px solid var(--ink-soft); height: 34px; }
                    .sig-caption {
                        font-size: 11.5px; color: var(--ink-soft); letter-spacing: .04em; margin-top: 6px;
                    }

                    .page-footer {
                        text-align: center; font-size: 10px; letter-spacing: .1em;
                        color: var(--ink-soft); text-transform: uppercase; padding: 26px 0 8px; opacity: .7;
                    }
                    .page-break { page-break-before: always; }
                    .company-footer {
                        text-align: center; font-size: 9px; color: var(--ink-soft);
                        border-top: 1px solid var(--rule); margin-top: 40px;
                        padding-top: 12px; line-height: 1.6;
                    }

                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
{{DOC_BODY}}
            </body>
            </html>
            """.formatted(escapeHtml(title)).replace("{{DOC_BODY}}", content);
    }

    private String wrapJoiningA4(String content, String title) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>%s</title>
                <style>
                    @page { size: A4 portrait; margin: 8mm 10mm; }
                    * { box-sizing: border-box; }
                    html, body { margin: 0; padding: 0; }
                    body {
                        font-family: Arial, Helvetica, sans-serif;
                        font-size: 9.5px;
                        line-height: 1.25;
                        color: #1e293b;
                        background: #fff;
                    }
                    .joining-a4 {
                        width: 100%%;
                    }
                    .join-head {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                        border-bottom: 2px solid #1a3a5c;
                        padding-bottom: 6px;
                        margin-bottom: 6px;
                    }
                    .join-logo {
                        height: 48px;
                        width: auto;
                        max-width: 200px;
                        object-fit: contain;
                        display: block;
                    }
                    .join-logo[src=""] { display: none; }
                    .join-meta {
                        text-align: right;
                        font-size: 8px;
                        color: #475569;
                        line-height: 1.35;
                        max-width: 62%%;
                    }
                    .join-title {
                        text-align: center;
                        font-size: 12px;
                        font-weight: 700;
                        color: #1a3a5c;
                        margin: 4px 0 6px;
                        letter-spacing: .04em;
                        text-transform: uppercase;
                    }
                    .join-table {
                        width: 100%%;
                        border-collapse: collapse;
                    }
                    .join-table td {
                        border: 1px solid #64748b;
                        padding: 2px 5px;
                        vertical-align: top;
                        word-wrap: break-word;
                    }
                    .join-table .lbl {
                        width: 32%%;
                        background: #f8fafc;
                        font-weight: 600;
                        color: #0f172a;
                        font-size: 8px;
                    }
                    .join-table .ref-lbl { width: 16%%; white-space: normal; line-height: 1.35; }
                    .join-table .val { font-size: 9px; line-height: 1.35; }
                    .blank-line {
                        display: inline-block;
                        min-width: 120px;
                        border-bottom: 1px solid #94a3b8;
                        padding: 0 4px;
                    }
                    .join-note {
                        margin: 6px 0 4px;
                        font-size: 8.5px;
                        line-height: 1.4;
                    }
                    .join-sign {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        margin-top: 6px;
                    }
                    .join-sign-line {
                        width: 180px;
                        border-bottom: 1px solid #334155;
                        height: 22px;
                        margin: 4px 0;
                    }
                    .join-photo {
                        width: 70px;
                        height: 84px;
                        border: 1px solid #334155;
                    }
                    .join-photo-cap {
                        text-align: center;
                        font-size: 8px;
                        margin-top: 2px;
                    }
                    .join-foot {
                        text-align: center;
                        font-size: 8px;
                        color: #475569;
                        margin-top: 8px;
                        line-height: 1.35;
                    }
                    .join-foot-name {
                        font-weight: 700;
                        color: #1a3a5c;
                        text-transform: uppercase;
                        letter-spacing: .04em;
                        margin-bottom: 2px;
                    }
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
{{DOC_BODY}}
            </body>
            </html>
            """.formatted(escapeHtml(title)).replace("{{DOC_BODY}}", content);
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
