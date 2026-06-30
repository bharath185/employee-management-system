package com.ems.service;

import com.ems.dto.SalaryDTO;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.Company;
import com.ems.model.Employee;
import com.ems.model.Salary;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.SalaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SalaryService {

    private final SalaryRepository salaryRepository;
    private final EmployeeRepository employeeRepository;
    private final CompanyService companyService;

    public Page<SalaryDTO> getSalaries(Integer year, Integer month, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("wageYear").descending().and(Sort.by("wageMonth").descending()));
        if (year != null && month != null) {
            return salaryRepository.findByWageYearAndWageMonth(year, month, pageable).map(SalaryDTO::fromEntity);
        }
        return salaryRepository.findAll(pageable).map(SalaryDTO::fromEntity);
    }

    public List<SalaryDTO> getSalariesByPeriod(Integer year, Integer month) {
        return salaryRepository.findByWageYearAndWageMonth(year, month).stream()
            .map(SalaryDTO::fromEntity)
            .collect(Collectors.toList());
    }

    public List<SalaryDTO> getSalariesByEmployee(Long employeeId) {
        return salaryRepository.findByEmployeeId(employeeId).stream()
            .map(SalaryDTO::fromEntity)
            .collect(Collectors.toList());
    }

    public SalaryDTO getSalaryById(Long id) {
        Salary salary = salaryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Salary record not found"));
        return SalaryDTO.fromEntity(salary);
    }

    public SalaryDTO getSalaryByEmployeeAndPeriod(Long employeeId, Integer year, Integer month) {
        Salary salary = salaryRepository.findByEmployeeIdAndWageYearAndWageMonth(employeeId, year, month)
            .orElseThrow(() -> new ResourceNotFoundException("Salary record not found for this period"));
        return SalaryDTO.fromEntity(salary);
    }

    @Transactional
    public SalaryDTO createSalary(SalaryDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (salaryRepository.existsByEmployeeIdAndWageYearAndWageMonth(
                dto.getEmployeeId(), dto.getWageYear(), dto.getWageMonth())) {
            throw new com.ems.exception.DuplicateResourceException(
                "Salary record already exists for this employee in this period");
        }

        Salary salary = Salary.builder()
            .employee(employee)
            .wageMonth(dto.getWageMonth())
            .wageYear(dto.getWageYear())
            .basic(dto.getBasic())
            .hra(dto.getHra())
            .fixedPersonalAllowance(dto.getFixedPersonalAllowance())
            .otherAllowance(dto.getOtherAllowance())
            .pfDeduction(dto.getPfDeduction())
            .esiDeduction(dto.getEsiDeduction())
            .ptDeduction(dto.getPtDeduction())
            .overtimeWages(dto.getOvertimeWages())
            .workingHoursPerDay(dto.getWorkingHoursPerDay() != null ? dto.getWorkingHoursPerDay() : 8)
            .weeklyOff(dto.getWeeklyOff() != null ? dto.getWeeklyOff() : "Allowed")
            .workerType(dto.getWorkerType() != null ? dto.getWorkerType() : "Permanent")
            .dateOfPayment(dto.getDateOfPayment())
            .build();

        salary.computeDerivedFields();
        salary = salaryRepository.save(salary);
        log.info("Created salary record for employee {} period {}/{}", employee.getEmployeeCode(), dto.getWageMonth(), dto.getWageYear());
        return SalaryDTO.fromEntity(salary);
    }

    @Transactional
    public SalaryDTO updateSalary(Long id, SalaryDTO dto) {
        Salary salary = salaryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Salary record not found"));

        salary.setBasic(dto.getBasic());
        salary.setHra(dto.getHra());
        salary.setFixedPersonalAllowance(dto.getFixedPersonalAllowance());
        salary.setOtherAllowance(dto.getOtherAllowance());
        salary.setPfDeduction(dto.getPfDeduction());
        salary.setEsiDeduction(dto.getEsiDeduction());
        salary.setPtDeduction(dto.getPtDeduction());
        salary.setOvertimeWages(dto.getOvertimeWages());
        salary.setWorkingHoursPerDay(dto.getWorkingHoursPerDay());
        salary.setWeeklyOff(dto.getWeeklyOff());
        salary.setWorkerType(dto.getWorkerType());
        salary.setDateOfPayment(dto.getDateOfPayment());

        salary.computeDerivedFields();
        salary = salaryRepository.save(salary);
        log.info("Updated salary record {} for employee {}", id, salary.getEmployee().getEmployeeCode());
        return SalaryDTO.fromEntity(salary);
    }

    @Transactional
    public void deleteSalary(Long id) {
        Salary salary = salaryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Salary record not found"));
        salaryRepository.delete(salary);
        log.info("Deleted salary record {} for employee {}", id, salary.getEmployee().getEmployeeCode());
    }

    public List<Integer> getDistinctYears() {
        return salaryRepository.findDistinctWageYears();
    }

    public List<Integer> getDistinctMonths(Integer year) {
        return salaryRepository.findDistinctWageMonthsByYear(year);
    }

    public Map<String, Object> getSalaryStats(Integer year, Integer month) {
        long count = salaryRepository.countByWagePeriod(year, month);
        List<Salary> salaries = salaryRepository.findByWageYearAndWageMonth(year, month);
        java.math.BigDecimal totalGross = salaries.stream()
            .map(Salary::getGrossSalary)
            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.math.BigDecimal totalNet = salaries.stream()
            .map(Salary::getNetPay)
            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.math.BigDecimal totalDeductions = totalGross.subtract(totalNet);

        return Map.of(
            "totalEmployees", count,
            "totalGross", totalGross,
            "totalNet", totalNet,
            "totalDeductions", totalDeductions
        );
    }

    public String generateSalarySlipHtml(Long salaryId) {
        Salary salary = salaryRepository.findById(salaryId)
            .orElseThrow(() -> new ResourceNotFoundException("Salary record not found"));
        Employee emp = salary.getEmployee();
        Company company = companyService.getCompany();

        NumberFormat fmt = NumberFormat.getNumberInstance(Locale.US);
        fmt.setMinimumFractionDigits(2);
        fmt.setMaximumFractionDigits(2);

        String monthName = java.time.Month.of(salary.getWageMonth()).name();
        monthName = monthName.charAt(0) + monthName.substring(1).toLowerCase();

        String fmtBasic = fmt.format(salary.getBasic());
        String fmtHra = fmt.format(salary.getHra());
        String fmtFpa = fmt.format(salary.getFixedPersonalAllowance());
        String fmtOa = fmt.format(salary.getOtherAllowance());
        String fmtGross = fmt.format(salary.getGrossSalary());
        String fmtPf = fmt.format(salary.getPfDeduction());
        String fmtEsi = fmt.format(salary.getEsiDeduction());
        String fmtPt = fmt.format(salary.getPtDeduction());
        String fmtNet = fmt.format(salary.getNetPay());
        String fmtOt = fmt.format(salary.getOvertimeWages());

        BigDecimal totalDeductions = salary.getPfDeduction()
            .add(salary.getEsiDeduction())
            .add(salary.getPtDeduction());
        String fmtTotalDed = fmt.format(totalDeductions);

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
        String year = String.valueOf(salary.getWageYear());
        String today = java.time.LocalDate.now().toString();

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
                <tr><td>Overtime Wages</td><td class="amt">%s</td><td></td><td></td></tr>
                <tr class="total-row"><td>Gross Earnings</td><td class="amt">%s</td><td>Total Deductions</td><td class="amt">%s</td></tr>
                <tr class="net-row"><td colspan="2"></td><td><strong>Net Pay</strong></td><td class="amt net-amt"><strong>%s</strong></td></tr>
              </table>
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
            fmtBasic, fmtPf, fmtHra, fmtEsi, fmtFpa, fmtPt, fmtOa, fmtOt, fmtGross, fmtTotalDed, fmtNet,
            signatory, today);
    }

    private String safe(String s) {
        return s != null && !s.isBlank() ? s : "-";
    }
}
