package com.ems.service;

import com.ems.dto.PayslipDTO;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.Company;
import com.ems.model.Employee;
import com.ems.model.Payslip;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.PayslipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.Month;
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
        return payslipRepository.findByWageYearAndWageMonth(year, month).stream()
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

        String fmtBasic = fmt.format(payslip.getBasic());
        String fmtHra = fmt.format(payslip.getHra());
        String fmtFpa = fmt.format(payslip.getFixedPersonalAllowance());
        String fmtOa = fmt.format(payslip.getOtherAllowance());
        String fmtBonus = fmt.format(payslip.getBonus());
        String fmtAppraisal = fmt.format(payslip.getAppraisalAmount());
        String fmtLateSitting = fmt.format(payslip.getLateSittingAmount());
        String fmtGross = fmt.format(payslip.getGrossSalary());
        String fmtPf = fmt.format(payslip.getPfDeduction());
        String fmtEsi = fmt.format(payslip.getEsiDeduction());
        String fmtPt = fmt.format(payslip.getPtDeduction());
        String fmtNet = fmt.format(payslip.getNetPay());
        String fmtOt = fmt.format(payslip.getOvertimeWages());
        String fmtTotalDed = fmt.format(payslip.getTotalDeductions());

        String cName = safe(company.getCompanyName());
        String cAddr = safe(company.getAddress());
        String cGst = safe(company.getGstNumber());
        String cPan = safe(company.getPanNumber());
        String signatory = safe(company.getAuthorizedSignatory());

        String eName = safe(emp.getFullName());
        String eCode = safe(emp.getEmployeeCode());
        String eDesig = safe(emp.getDesignation());
        String eDept = safe(emp.getProcessAssigned());
        String eBank = safe(emp.getBankName());
        String eAcc = safe(emp.getAccountNumber());
        String eUan = safe(emp.getUanNo());
        String ePf = safe(emp.getPfNo());
        String eEsic = safe(emp.getEsicNo());
        String doj = emp.getDoj() != null ? emp.getDoj().toString() : "-";
        String year = String.valueOf(payslip.getWageYear());
        String today = LocalDate.now().toString();

        return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <style>
              @page { size: A4; margin: 15mm; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; padding: 20px; }
              .header { text-align: center; margin-bottom: 24px; border-bottom: 3px solid #1a237e; padding-bottom: 16px; }
              .header h1 { font-size: 26px; color: #1a237e; letter-spacing: 2px; margin-bottom: 4px; }
              .header .company-name { font-size: 18px; color: #3949ab; font-weight: 500; }
              .header .company-detail { font-size: 11px; color: #666; }
              .header .slip-title { font-size: 14px; color: #555; margin-top: 6px; font-weight: 600; }
              .section { margin-bottom: 20px; }
              .section-title { font-size: 13px; font-weight: 700; color: #1a237e; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
              .info-grid { display: flex; flex-wrap: wrap; gap: 4px 20px; font-size: 12px; }
              .info-grid .label { color: #666; display: inline-block; width: 130px; }
              .info-grid .value { font-weight: 500; }
              .salary-table { width: 100%%; border-collapse: collapse; font-size: 13px; }
              .salary-table th { background: #1a237e; color: #fff; padding: 8px 12px; text-align: left; }
              .salary-table td { padding: 7px 12px; border-bottom: 1px solid #ddd; }
              .salary-table tr:last-child td { border-bottom: 2px solid #1a237e; }
              .amt { text-align: right; width: 130px; }
              .total-row td { font-weight: 700; background: #e8eaf6; }
              .net-row td { font-weight: 700; background: #c5cae9; font-size: 14px; }
              .net-amt { color: #1a237e; font-size: 16px; }
              .attendance-info { font-size: 12px; margin-top: 12px; padding: 8px; background: #f5f5f5; border-radius: 4px; }
              .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #555; }
              .footer .signatory { text-align: right; }
              .footer .signatory .name { font-weight: 600; color: #222; margin-top: 50px; }
              .note { font-size: 10px; color: #999; margin-top: 12px; border-top: 1px solid #eee; padding-top: 8px; }
            </style>
            </head>
            <body>
            <div class="header">
              <h1>PAY SLIP</h1>
              <div class="company-name">%s</div>
              <div class="company-detail">%s | GST: %s | PAN: %s</div>
              <div class="slip-title">%s %s</div>
            </div>
            <div class="section">
              <div class="section-title">Employee Details</div>
              <div class="info-grid">
                <span><span class="label">Name</span><span class="value">%s</span></span>
                <span><span class="label">Employee Code</span><span class="value">%s</span></span>
                <span><span class="label">Designation</span><span class="value">%s</span></span>
                <span><span class="label">Department</span><span class="value">%s</span></span>
                <span><span class="label">Date of Joining</span><span class="value">%s</span></span>
                <span><span class="label">UAN</span><span class="value">%s</span></span>
                <span><span class="label">PF No.</span><span class="value">%s</span></span>
                <span><span class="label">ESIC No.</span><span class="value">%s</span></span>
                <span><span class="label">Bank</span><span class="value">%s</span></span>
                <span><span class="label">Account No.</span><span class="value">%s</span></span>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Salary Details</div>
              <table class="salary-table">
                <tr><th>Earnings</th><th class="amt">Amount (INR)</th><th>Deductions</th><th class="amt">Amount (INR)</th></tr>
                <tr><td>Basic</td><td class="amt">%s</td><td>PF</td><td class="amt">%s</td></tr>
                <tr><td>HRA</td><td class="amt">%s</td><td>ESI</td><td class="amt">%s</td></tr>
                <tr><td>Fixed Personal Allowance</td><td class="amt">%s</td><td>Professional Tax</td><td class="amt">%s</td></tr>
                <tr><td>Other Allowance</td><td class="amt">%s</td><td></td><td></td></tr>
                <tr><td>Bonus</td><td class="amt">%s</td><td></td><td></td></tr>
                <tr><td>Appraisal Amount</td><td class="amt">%s</td><td></td><td></td></tr>
                <tr><td>Late Sitting Amount</td><td class="amt">%s</td><td></td><td></td></tr>
                <tr><td>Overtime Wages</td><td class="amt">%s</td><td></td><td></td></tr>
                <tr class="total-row"><td>Gross Earnings</td><td class="amt">%s</td><td>Total Deductions</td><td class="amt">%s</td></tr>
                <tr class="net-row"><td colspan="2"></td><td><strong>Net Pay</strong></td><td class="amt net-amt"><strong>%s</strong></td></tr>
              </table>
            </div>
            <div class="attendance-info">
              <strong>Attendance:</strong> Present: %d | Absent: %d | Leave: %d | Total Working Days: %d
            </div>
            <div class="footer">
              <div>This is a computer-generated document.</div>
              <div class="signatory">
                <div>Authorized Signatory</div>
                <div class="name">%s</div>
              </div>
            </div>
            <div class="note">Employee Self-Service Portal | Generated on %s</div>
            </body>
            </html>
            """,
            cName, cAddr, cGst, cPan, monthName, year,
            eName, eCode, eDesig, eDept, doj, eUan, ePf, eEsic, eBank, eAcc,
            fmtBasic, fmtPf, fmtHra, fmtEsi, fmtFpa, fmtPt, fmtOa, fmtBonus, fmtAppraisal, fmtLateSitting, fmtOt,
            fmtGross, fmtTotalDed, fmtNet,
            payslip.getPresentDays() != null ? payslip.getPresentDays() : 0,
            payslip.getAbsentDays() != null ? payslip.getAbsentDays() : 0,
            payslip.getLeaveDays() != null ? payslip.getLeaveDays() : 0,
            payslip.getTotalWorkingDays() != null ? payslip.getTotalWorkingDays() : 0,
            signatory, today);
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

    private String safe(String s) {
        return s != null && !s.isBlank() ? s : "-";
    }
}
