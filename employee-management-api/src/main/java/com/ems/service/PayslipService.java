package com.ems.service;

import com.ems.dto.PayslipDTO;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.Company;
import com.ems.model.Employee;
import com.ems.model.Payslip;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.PayslipRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PayslipService {

    private final PayslipRepository payslipRepository;
    private final EmployeeRepository employeeRepository;
    private final CompanyService companyService;

    public List<PayslipDTO> getPayslips(Integer year, Integer month) {
        return payslipRepository.findByWageYearAndWageMonthWithEmployee(year, month).stream()
            .map(PayslipDTO::fromEntity)
            .collect(Collectors.toList());
    }

    public List<PayslipDTO> getEmployeePayslips(Long employeeId) {
        return payslipRepository.findByEmployeeId(employeeId).stream()
            .map(PayslipDTO::fromEntity)
            .collect(Collectors.toList());
    }

    public PayslipDTO getPayslipById(Long id) {
        Payslip payslip = payslipRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Payslip not found"));
        return PayslipDTO.fromEntity(payslip);
    }

    public Map<String, Object> getPayslipStats(Integer year, Integer month) {
        long count = payslipRepository.countByWageYearAndWageMonth(year, month);
        BigDecimal totalGross = payslipRepository.sumGrossByWageYearAndWageMonth(year, month);
        BigDecimal totalNet = payslipRepository.sumNetByWageYearAndWageMonth(year, month);
        BigDecimal totalDeductions = payslipRepository.sumDeductionsByWageYearAndWageMonth(year, month);

        return Map.of(
            "totalEmployees", count,
            "totalGross", totalGross,
            "totalNet", totalNet,
            "totalDeductions", totalDeductions
        );
    }

    public String getPayslipHtml(Long payslipId) {
        Payslip payslip = payslipRepository.findById(payslipId)
            .orElseThrow(() -> new ResourceNotFoundException("Payslip not found"));
        Employee emp = payslip.getEmployee();
        Company company = companyService.getCompany();

        NumberFormat fmt = NumberFormat.getNumberInstance(Locale.US);
        fmt.setMinimumFractionDigits(2);
        fmt.setMaximumFractionDigits(2);

        String monthName = Month.of(payslip.getWageMonth()).name();
        monthName = monthName.charAt(0) + monthName.substring(1).toLowerCase();

        String cName = safe(company.getCompanyName());
        String cAddr = safe(company.getAddress());
        String cPhone = safe(company.getPhone());
        String cEmail = safe(company.getEmail());
        String logoPath = company.getLogoPath() != null && !company.getLogoPath().isBlank()
            ? company.getLogoPath() : "";

        String eName = safe(emp.getFullName());
        String eCode = safe(emp.getEmployeeCode());
        String eDesig = safe(emp.getDesignation());
        String eDept = safe(emp.getProcessAssigned());
        String eBank = safe(emp.getBankName());
        String eAcc = safe(emp.getAccountNumber());
        String ePan = safe(emp.getPanNumber());
        String eUan = safe(emp.getUanNo());
        String ePf = safe(emp.getPfNo());
        String eBranch = safe(emp.getBranch());
        String doj = emp.getDoj() != null ? emp.getDoj().toString() : "-";
        String year = String.valueOf(payslip.getWageYear());

        String fmtBasic = fmt.format(payslip.getBasic());
        String fmtHra = fmt.format(payslip.getHra());
        String fmtOa = fmt.format(payslip.getOtherAllowance());
        String fmtFpa = fmt.format(payslip.getFixedPersonalAllowance());
        String fmtPf = fmt.format(payslip.getPfDeduction());
        String fmtPt = fmt.format(payslip.getPtDeduction());
        String fmtGross = fmt.format(payslip.getGrossSalary());
        String fmtTotalDed = fmt.format(payslip.getTotalDeductions());
        String fmtNet = fmt.format(payslip.getNetPay());

        int effectiveWorkdays = payslip.getEffectiveWorkdays() != null ? payslip.getEffectiveWorkdays() : 0;
        int lop = payslip.getLopDays() != null ? payslip.getLopDays() : 0;

        String logoHtml = (company.getLogoPath() != null && !company.getLogoPath().isBlank())
            ? "<img src=\"/api/v1/company/logo\" alt=\"Logo\" style=\"height:80px;width:auto;object-fit:contain;\">"
            : "";

        String netWords = amountInWords(payslip.getNetPay());

        return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <style>
              @page { size: A4 landscape; margin: 12mm; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Segoe UI', Arial, sans-serif; color: #000; padding: 16px 24px; font-size: 13px; }
              .header { display: flex; align-items: center; justify-content: center; border: 2px solid #000; padding: 16px 20px; }
              .logo-col { display: flex; align-items: center; min-width: 100px; }
              .company-col { text-align: center; flex: 1; }
              .company-col h1 { font-size: 20px; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 2px; }
              .company-col .addr { font-size: 11px; color: #333; line-height: 1.4; }
              .payslip-label { font-size: 14px; font-weight: 700; color: #555; min-width: 100px; text-align: right; }
              .title-row { border: 2px solid #000; border-top: none; padding: 10px; text-align: center; font-size: 15px; font-weight: 700; }
              .info-section { border: 2px solid #000; border-top: none; display: flex; }
              .info-left, .info-right { flex: 1; padding: 12px 16px; }
              .info-left { border-right: 2px solid #000; }
              .info-row { display: flex; margin-bottom: 6px; font-size: 12.5px; }
              .info-row .lbl { width: 140px; font-weight: 600; flex-shrink: 0; }
              .info-row .val { font-weight: 400; }
              .tables-section { border: 2px solid #000; border-top: none; display: flex; }
              .earnings-col, .deductions-col { flex: 1; }
              .earnings-col { border-right: 2px solid #000; }
              .tbl-header { background: #f0f0f0; font-weight: 700; font-size: 12px; display: flex; border-bottom: 1px solid #000; }
              .tbl-header span { padding: 7px 12px; }
              .tbl-header .col-earnings { width: 42%%; }
              .tbl-header .col-full { width: 29%%; text-align: center; }
              .tbl-header .col-actual { width: 29%%; text-align: right; }
              .tbl-header .col-ded { width: 60%%; }
              .tbl-header .col-ded-act { width: 40%%; text-align: right; }
              .tbl-row { display: flex; border-bottom: 1px solid #e0e0e0; font-size: 12.5px; }
              .tbl-row span { padding: 6px 12px; }
              .tbl-row .col-earnings { width: 42%%; }
              .tbl-row .col-full { width: 29%%; text-align: center; }
              .tbl-row .col-actual { width: 29%%; text-align: right; }
              .tbl-row .col-ded { width: 60%%; }
              .tbl-row .col-ded-act { width: 40%%; text-align: right; }
              .total-section { border: 2px solid #000; border-top: none; display: flex; }
              .total-left, .total-right { flex: 1; padding: 8px 12px; font-weight: 700; font-size: 12.5px; }
              .total-left { border-right: 2px solid #000; }
              .net-section { border: 2px solid #000; border-top: none; padding: 10px 12px; font-size: 13px; font-weight: 700; }
              .net-amount { font-size: 15px; color: #000; margin-top: 4px; }
              .words-section { border: 2px solid #000; border-top: none; padding: 8px 12px; font-size: 12px; font-style: italic; color: #333; }
              .footer-note { text-align: center; font-size: 11px; color: #555; margin-top: 12px; padding-top: 6px; }
            </style>
            </head>
            <body>
            <div class="header">
              <div class="logo-col">%s</div>
              <div class="company-col">
                <h1>%s</h1>
                <div class="addr">%s &nbsp;|&nbsp; Phone: %s &nbsp;|&nbsp; Email: %s</div>
              </div>
              <div class="payslip-label">PAY SLIP</div>
            </div>
            <div class="title-row">Payslip for the month of %s %s</div>
            <div class="info-section">
              <div class="info-left">
                <div class="info-row"><span class="lbl">Name:</span><span class="val">%s</span></div>
                <div class="info-row"><span class="lbl">Joining Date:</span><span class="val">%s</span></div>
                <div class="info-row"><span class="lbl">Designation:</span><span class="val">%s</span></div>
                <div class="info-row"><span class="lbl">Department:</span><span class="val">%s</span></div>
                <div class="info-row"><span class="lbl">Location:</span><span class="val">%s</span></div>
                <div class="info-row"><span class="lbl">Effective Work Days:</span><span class="val">%d</span></div>
                <div class="info-row"><span class="lbl">LOP:</span><span class="val">%d</span></div>
              </div>
              <div class="info-right">
                <div class="info-row"><span class="lbl">Employee No:</span><span class="val">%s</span></div>
                <div class="info-row"><span class="lbl">Bank Name:</span><span class="val">%s</span></div>
                <div class="info-row"><span class="lbl">Bank Account No:</span><span class="val">%s</span></div>
                <div class="info-row"><span class="lbl">PAN Number:</span><span class="val">%s</span></div>
                <div class="info-row"><span class="lbl">PF No:</span><span class="val">%s</span></div>
                <div class="info-row"><span class="lbl">PF UAN:</span><span class="val">%s</span></div>
              </div>
            </div>
            <div class="tables-section">
              <div class="earnings-col">
                <div class="tbl-header">
                  <span class="col-earnings">Earnings</span>
                  <span class="col-full">Full</span>
                  <span class="col-actual">Actual</span>
                </div>
                <div class="tbl-row"><span class="col-earnings">BASIC</span><span class="col-full">%s</span><span class="col-actual">%s</span></div>
                <div class="tbl-row"><span class="col-earnings">HRA</span><span class="col-full">%s</span><span class="col-actual">%s</span></div>
                <div class="tbl-row"><span class="col-earnings">OTHER ALLOWANCE</span><span class="col-full">%s</span><span class="col-actual">%s</span></div>
                <div class="tbl-row"><span class="col-earnings">PERSONAL ALLOWANCE</span><span class="col-full">%s</span><span class="col-actual">%s</span></div>
              </div>
              <div class="deductions-col">
                <div class="tbl-header">
                  <span class="col-ded">Deductions</span>
                  <span class="col-ded-act">Actual</span>
                </div>
                <div class="tbl-row"><span class="col-ded">PF</span><span class="col-ded-act">%s</span></div>
                <div class="tbl-row"><span class="col-ded">PROF TAX</span><span class="col-ded-act">%s</span></div>
              </div>
            </div>
            <div class="total-section">
              <div class="total-left">Total Earnings: INR. %s</div>
              <div class="total-right">Total Deductions: INR. %s</div>
            </div>
            <div class="net-section">
              Net Pay for the month ( Total Earnings - Total Deductions): <span class="net-amount">INR. %s</span>
            </div>
            <div class="words-section">(Rupees %s Only)</div>
            <div class="footer-note">This is a system generated payslip and does not require signature.</div>
            </body>
            </html>
            """,
            logoHtml, cName, cAddr, cPhone, cEmail, monthName, year,
            eName, doj, eDesig, eDept, eBranch, effectiveWorkdays, lop,
            eCode, eBank, eAcc, ePan, ePf, eUan,
            fmtBasic, fmtBasic, fmtHra, fmtHra, fmtOa, fmtOa, fmtFpa, fmtFpa,
            fmtPf, fmtPt,
            fmtGross, fmtTotalDed, fmtNet,
            netWords);
    }

    private String amountInWords(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) return "Zero";
        long rupees = amount.longValue();
        long paise = amount.subtract(new BigDecimal(rupees)).movePointRight(2).longValue();
        StringBuilder sb = new StringBuilder();
        sb.append(numberToWords(rupees));
        if (paise > 0) {
            sb.append(" and ").append(numberToWords(paise)).append(" Paise");
        }
        return sb.toString();
    }

    private String numberToWords(long num) {
        if (num == 0) return "Zero";
        StringBuilder sb = new StringBuilder();
        if (num >= 10000000) { sb.append(twoDigitWords(num / 10000000)).append(" Crore "); num %= 10000000; }
        if (num >= 100000) { sb.append(twoDigitWords(num / 100000)).append(" Lakh "); num %= 100000; }
        if (num >= 1000) { sb.append(twoDigitWords(num / 1000)).append(" Thousand "); num %= 1000; }
        if (num >= 100) { sb.append(ones((int)(num / 100))).append(" Hundred "); num %= 100; }
        if (num > 0) {
            if (!sb.isEmpty()) sb.append("and ");
            if (num >= 20) {
                sb.append(tens((int)(num / 10)));
                if (num % 10 > 0) sb.append(" ").append(ones((int)(num % 10)));
            } else {
                sb.append(ones((int)num));
            }
            sb.append(" ");
        }
        return sb.toString().trim();
    }

    private String twoDigitWords(long n) {
        if (n == 0) return "";
        if (n < 20) return ones((int)n);
        String result = tens((int)(n / 10));
        if (n % 10 > 0) result += " " + ones((int)(n % 10));
        return result;
    }

    private String ones(int n) {
        String[] arr = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"};
        return arr[n];
    }

    private String tens(int n) {
        String[] arr = {"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"};
        return arr[n];
    }

    public byte[] generatePayslipPdf(Long payslipId) {
        Payslip payslip = payslipRepository.findById(payslipId)
            .orElseThrow(() -> new ResourceNotFoundException("Payslip not found"));
        Employee emp = payslip.getEmployee();
        Company company = companyService.getCompany();

        NumberFormat fmt = NumberFormat.getNumberInstance(Locale.US);
        fmt.setMinimumFractionDigits(2);
        fmt.setMaximumFractionDigits(2);

        String monthName = Month.of(payslip.getWageMonth()).name();
        monthName = monthName.charAt(0) + monthName.substring(1).toLowerCase();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4.rotate(), 25, 25, 15, 15);
        PdfWriter writer = PdfWriter.getInstance(doc, baos);
        doc.open();

        Color black = Color.BLACK;
        Color white = Color.WHITE;
        Color darkGray = new Color(55, 55, 55);
        Color medGray = new Color(120, 120, 120);
        Color headerBg = new Color(240, 240, 240);
        Color borderCol = Color.BLACK;

        float pageWidth = doc.getPageSize().getWidth() - doc.leftMargin() - doc.rightMargin();
        float pageH = doc.getPageSize().getHeight();
        PdfContentByte cb = writer.getDirectContent();

        float topY = pageH - doc.topMargin();
        float margin = doc.leftMargin();

        // ===== HEADER BOX =====
        float headerH = 90;
        cb.setColorStroke(black);
        cb.setLineWidth(1.5f);
        cb.rectangle(margin, topY - headerH, pageWidth, headerH);
        cb.stroke();

        // Logo (left, bigger)
        float logoLeftX = margin + 12;
        if (company != null && company.getLogoPath() != null && !company.getLogoPath().isBlank()) {
            try {
                Path logoFilePath = resolveLogoPath(company.getLogoPath());
                if (logoFilePath != null && Files.exists(logoFilePath)) {
                    Image logo = Image.getInstance(logoFilePath.toAbsolutePath().toString());
                    logo.scaleToFit(65, 65);
                    logo.setAbsolutePosition(logoLeftX, topY - headerH + 10);
                    cb.addImage(logo);
                }
            } catch (Exception e) {
                log.warn("Could not load logo for payslip: {}", e.getMessage());
            }
        }

        // Company name (center)
        String companyName = safe(company != null ? company.getCompanyName() : "Company");
        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER,
            new Paragraph(companyName, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, black)),
            margin + pageWidth / 2, topY - 28, 0);

        // Contact info (center, below name)
        String addr = safe(company != null ? company.getAddress() : "");
        String phone = safe(company != null ? company.getPhone() : "");
        String email = safe(company != null ? company.getEmail() : "");
        String contactInfo = addr;
        if (!phone.equals("-") || !email.equals("-")) {
            contactInfo += "  |  Phone: " + phone + "  |  Email: " + email;
        }
        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER,
            new Paragraph(contactInfo, FontFactory.getFont(FontFactory.HELVETICA, 9, darkGray)),
            margin + pageWidth / 2, topY - 48, 0);

        // PAY SLIP label (right)
        ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT,
            new Paragraph("PAY SLIP", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, darkGray)),
            margin + pageWidth - 15, topY - 28, 0);

        float y = topY - headerH;

        // ===== TITLE ROW =====
        float titleH = 26;
        cb.setLineWidth(1.5f);
        cb.rectangle(margin, y - titleH, pageWidth, titleH);
        cb.stroke();
        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER,
            new Paragraph("Payslip for the month of " + monthName + " " + payslip.getWageYear(),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, black)),
            margin + pageWidth / 2, y - 17, 0);
        y -= titleH;

        // ===== EMPLOYEE INFO =====
        Font lblF = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, black);
        Font valF = FontFactory.getFont(FontFactory.HELVETICA, 10, darkGray);
        float rowH = 17;
        String empDoj = emp.getDoj() != null ? emp.getDoj().format(DateTimeFormatter.ofPattern("dd MMM yyyy")) : "-";
        String[][] leftInfo = {
            {"Name:", safe(emp.getFullName())},
            {"Joining Date:", empDoj},
            {"Designation:", safe(emp.getDesignation())},
            {"Department:", safe(emp.getProcessAssigned())},
            {"Location:", safe(emp.getBranch())},
            {"Effective Work Days:", String.valueOf(payslip.getEffectiveWorkdays() != null ? payslip.getEffectiveWorkdays() : 0)},
            {"LOP:", String.valueOf(payslip.getLopDays() != null ? payslip.getLopDays() : 0)}
        };
        String[][] rightInfo = {
            {"Employee No:", safe(emp.getEmployeeCode())},
            {"Bank Name:", safe(emp.getBankName())},
            {"Bank Account No:", safe(emp.getAccountNumber())},
            {"PAN Number:", safe(emp.getPanNumber())},
            {"PF No:", safe(emp.getPfNo())},
            {"PF UAN:", safe(emp.getUanNo())}
        };
        int maxRows = Math.max(leftInfo.length, rightInfo.length);
        float infoH = maxRows * rowH + 8;
        cb.setLineWidth(1.5f);
        cb.rectangle(margin, y - infoH, pageWidth, infoH);
        cb.stroke();
        cb.setLineWidth(0.5f);
        cb.moveTo(margin + pageWidth / 2, y - 4);
        cb.lineTo(margin + pageWidth / 2, y - infoH + 4);
        cb.stroke();

        float ly = y - 14;
        for (String[] row : leftInfo) {
            Paragraph p = new Paragraph();
            p.add(new Chunk(row[0] + "  ", lblF));
            p.add(new Chunk(row[1], valF));
            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, p, margin + 10, ly, 0);
            ly -= rowH;
        }
        float ry = y - 14;
        for (String[] row : rightInfo) {
            Paragraph p = new Paragraph();
            p.add(new Chunk(row[0] + "  ", lblF));
            p.add(new Chunk(row[1], valF));
            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, p, margin + pageWidth / 2 + 10, ry, 0);
            ry -= rowH;
        }
        y -= (infoH);

        // ===== EARNINGS & DEDUCTIONS TABLES =====
        float earnW = pageWidth * 0.55f;
        float dedW = pageWidth * 0.38f;
        float tableH = 125;
        Font hdrF = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, black);
        Font datF = FontFactory.getFont(FontFactory.HELVETICA, 9, darkGray);
        Font totF = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, black);

        // Earnings table
        PdfPTable eTable = new PdfPTable(new float[]{3f, 1.5f, 1.5f});
        eTable.setTotalWidth(earnW);
        addHdr(eTable, "Earnings", hdrF, headerBg);
        addHdr(eTable, "Full", hdrF, headerBg);
        addHdrR(eTable, "Actual", hdrF, headerBg);
        addRow(eTable, "Basic", fmt.format(payslip.getBasic()), fmt.format(payslip.getBasic()), datF, white);
        addRow(eTable, "HRA", fmt.format(payslip.getHra()), fmt.format(payslip.getHra()), datF, white);
        addRow(eTable, "Other Allowance", fmt.format(payslip.getOtherAllowance()), fmt.format(payslip.getOtherAllowance()), datF, white);
        addRow(eTable, "Personal Allowance", fmt.format(payslip.getFixedPersonalAllowance()), fmt.format(payslip.getFixedPersonalAllowance()), datF, white);
        addTotalRow(eTable, "Total Earnings", fmt.format(payslip.getGrossSalary()), totF, headerBg);
        eTable.writeSelectedRows(0, -1, margin + 5, y, cb);

        // Deductions table
        PdfPTable dTable = new PdfPTable(new float[]{3f, 2f});
        dTable.setTotalWidth(dedW);
        addHdr(dTable, "Deductions", hdrF, headerBg);
        addHdrR(dTable, "Actual", hdrF, headerBg);
        addDedRow(dTable, "PF", fmt.format(payslip.getPfDeduction()), datF, white);
        addDedRow(dTable, "Professional Tax", fmt.format(payslip.getPtDeduction()), datF, white);
        addDedTotalRow(dTable, "Total Deductions", fmt.format(payslip.getTotalDeductions()), totF, headerBg);

        float dedX = margin + earnW + 14;
        dTable.writeSelectedRows(0, -1, dedX, y, cb);

        // Border around both tables
        cb.setColorStroke(black);
        cb.setLineWidth(1.5f);
        cb.rectangle(margin, y - tableH, pageWidth, tableH);
        cb.stroke();
        cb.setLineWidth(0.5f);
        cb.moveTo(dedX - 7, y - 3);
        cb.lineTo(dedX - 7, y - tableH + 3);
        cb.stroke();

        y -= (tableH);

        // ===== NET PAY ROW =====
        float netH = 30;
        cb.setLineWidth(1.5f);
        cb.rectangle(margin, y - netH, pageWidth, netH);
        cb.stroke();
        ColumnText.showTextAligned(cb, Element.ALIGN_LEFT,
            new Paragraph("Net Pay for the month ( Total Earnings - Total Deductions):",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, black)),
            margin + 12, y - 18, 0);
        ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT,
            new Paragraph("INR. " + fmt.format(payslip.getNetPay()),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, black)),
            margin + pageWidth - 12, y - 20, 0);
        y -= netH;

        // ===== AMOUNT IN WORDS =====
        String words = amountInWords(payslip.getNetPay());
        cb.setLineWidth(1.5f);
        cb.rectangle(margin, y - 22, pageWidth, 22);
        cb.stroke();
        ColumnText.showTextAligned(cb, Element.ALIGN_LEFT,
            new Paragraph("(Rupees " + words + " Only)",
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, darkGray)),
            margin + 12, y - 15, 0);
        y -= 24;

        // ===== FOOTER =====
        cb.setColorStroke(medGray);
        cb.setLineWidth(0.5f);
        cb.moveTo(margin, y);
        cb.lineTo(margin + pageWidth, y);
        cb.stroke();
        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER,
            new Paragraph("This is a system generated payslip and does not require signature.",
                FontFactory.getFont(FontFactory.HELVETICA, 9, medGray)),
            margin + pageWidth / 2, y - 12, 0);

        doc.close();
        return baos.toByteArray();
    }

    private void addHdr(PdfPTable t, String txt, Font f, Color bg) {
        PdfPCell c = new PdfPCell(new Phrase(txt, f));
        c.setBackgroundColor(bg); c.setPadding(6); c.setBorderWidth(0);
        t.addCell(c);
    }

    private void addHdrR(PdfPTable t, String txt, Font f, Color bg) {
        PdfPCell c = new PdfPCell(new Phrase(txt, f));
        c.setBackgroundColor(bg); c.setPadding(6); c.setBorderWidth(0);
        c.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(c);
    }

    private void addRow(PdfPTable t, String lbl, String amt1, String amt2, Font f, Color bg) {
        PdfPCell c1 = new PdfPCell(new Phrase(lbl, f));
        c1.setBackgroundColor(bg); c1.setPadding(5); c1.setBorderWidth(0); c1.setPaddingLeft(10);
        t.addCell(c1);
        PdfPCell c2 = new PdfPCell(new Phrase(amt1, f));
        c2.setBackgroundColor(bg); c2.setPadding(5); c2.setBorderWidth(0);
        c2.setHorizontalAlignment(Element.ALIGN_CENTER);
        t.addCell(c2);
        PdfPCell c3 = new PdfPCell(new Phrase(amt2, f));
        c3.setBackgroundColor(bg); c3.setPadding(5); c3.setBorderWidth(0);
        c3.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(c3);
    }

    private void addTotalRow(PdfPTable t, String lbl, String amt1, Font f, Color bg) {
        PdfPCell c1 = new PdfPCell(new Phrase(lbl, f));
        c1.setBackgroundColor(bg); c1.setPadding(5); c1.setBorderWidth(0);
        t.addCell(c1);
        PdfPCell c2 = new PdfPCell(new Phrase("INR. " + amt1, f));
        c2.setBackgroundColor(bg); c2.setPadding(5); c2.setBorderWidth(0);
        c2.setHorizontalAlignment(Element.ALIGN_CENTER);
        t.addCell(c2);
        PdfPCell c3 = new PdfPCell();
        c3.setBackgroundColor(bg); c3.setBorderWidth(0);
        t.addCell(c3);
    }

    private void addDedRow(PdfPTable t, String lbl, String amt, Font f, Color bg) {
        PdfPCell c1 = new PdfPCell(new Phrase(lbl, f));
        c1.setBackgroundColor(bg); c1.setPadding(5); c1.setBorderWidth(0); c1.setPaddingLeft(10);
        t.addCell(c1);
        PdfPCell c2 = new PdfPCell(new Phrase(amt, f));
        c2.setBackgroundColor(bg); c2.setPadding(5); c2.setBorderWidth(0);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(c2);
    }

    private void addDedTotalRow(PdfPTable t, String lbl, String amt, Font f, Color bg) {
        PdfPCell c1 = new PdfPCell(new Phrase(lbl, f));
        c1.setBackgroundColor(bg); c1.setPadding(5); c1.setBorderWidth(0);
        t.addCell(c1);
        PdfPCell c2 = new PdfPCell(new Phrase("INR. " + amt, f));
        c2.setBackgroundColor(bg); c2.setPadding(5); c2.setBorderWidth(0);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(c2);
    }

    @Transactional
    public void markAsSent(Long payslipId) {
        Payslip payslip = payslipRepository.findById(payslipId)
            .orElseThrow(() -> new ResourceNotFoundException("Payslip not found"));
        payslip.setStatus("SENT");
        payslip.setSentAt(java.time.LocalDateTime.now());
        payslipRepository.save(payslip);
        log.info("Payslip {} marked as SENT", payslipId);
    }

    @Transactional
    public int deletePayslipsByPeriod(Integer year, Integer month) {
        List<Payslip> payslips = payslipRepository.findByWageYearAndWageMonth(year, month);
        payslipRepository.deleteAll(payslips);
        log.info("Deleted {} payslips for {}/{}", payslips.size(), month, year);
        return payslips.size();
    }

    private String safe(String s) {
        return s != null && !s.isBlank() ? s : "-";
    }

    private Path resolveLogoPath(String logoPath) {
        Path direct = Paths.get(logoPath);
        if (Files.exists(direct)) return direct;
        Path resolved = Paths.get("uploads/company").resolve(Paths.get(logoPath).getFileName());
        if (Files.exists(resolved)) return resolved;
        return null;
    }
}
