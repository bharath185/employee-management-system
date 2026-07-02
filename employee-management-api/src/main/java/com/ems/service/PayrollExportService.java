package com.ems.service;

import com.ems.model.Payslip;
import com.ems.repository.PayslipRepository;
import com.ems.utils.BankFileExportHelper;
import com.ems.utils.PayrollReportExportHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Month;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PayrollExportService {

    private final PayslipRepository payslipRepository;
    private final BankFileExportHelper bankFileExportHelper;
    private final PayrollReportExportHelper payrollReportExportHelper;

    /**
     * Generate bank file Excel for a given payroll period.
     */
    public ResponseEntity<byte[]> exportBankFile(Integer year, Integer month) {
        List<Payslip> payslips = payslipRepository.findByWageYearAndWageMonthWithEmployee(year, month);

        String periodLabel = Month.of(month).name().charAt(0)
            + Month.of(month).name().substring(1).toLowerCase() + "_" + year;

        byte[] excelBytes = bankFileExportHelper.generateBankFile(payslips, periodLabel);

        String filename = "Bank_File_" + periodLabel + ".xlsx";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(excelBytes);
    }

    /**
     * Generate payroll report Excel for a given payroll period.
     */
    public ResponseEntity<byte[]> exportPayrollReport(Integer year, Integer month) {
        List<Payslip> payslips = payslipRepository.findByWageYearAndWageMonthWithEmployee(year, month);

        String periodLabel = Month.of(month).name().charAt(0)
            + Month.of(month).name().substring(1).toLowerCase() + "_" + year;

        byte[] excelBytes = payrollReportExportHelper.generatePayrollReport(payslips, periodLabel);

        String filename = "Payroll_Report_" + periodLabel + ".xlsx";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(excelBytes);
    }
}
