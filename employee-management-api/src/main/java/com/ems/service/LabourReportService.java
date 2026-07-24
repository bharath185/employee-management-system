package com.ems.service;

import com.ems.model.CompOff;
import com.ems.model.Employee;
import com.ems.model.Payslip;
import com.ems.repository.CompOffRepository;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.PayslipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LabourReportService {

    private final PayslipRepository payslipRepository;
    private final CompOffRepository compOffRepository;
    private final EmployeeRepository employeeRepository;

    public List<Map<String, Object>> getBonusRegister(Integer year, Integer month) {
        List<Payslip> payslips = payslipRepository.findByWageYearAndWageMonth(year, month);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Payslip p : payslips) {
            Employee e = p.getEmployee();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("employeeCode", e.getEmployeeCode());
            row.put("employeeName", e.getFullName());
            row.put("designation", e.getDesignation());
            row.put("basic", p.getBasic());
            row.put("hra", p.getHra());
            row.put("otherAllowance", p.getOtherAllowance());
            row.put("personalAllowance", p.getFixedPersonalAllowance());
            row.put("grossSalary", p.getGrossSalary());
            row.put("totalDeductions", p.getTotalDeductions());
            row.put("netPay", p.getNetPay());
            result.add(row);
        }
        return result;
    }

    public List<Map<String, Object>> getOvertimeRegister(Integer year, Integer month) {
        List<Employee> employees = employeeRepository.findAllLiveEmployees();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Employee e : employees) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("employeeCode", e.getEmployeeCode());
            row.put("employeeName", e.getFullName());
            row.put("designation", e.getDesignation());
            row.put("department", e.getProcessAssigned());
            row.put("overtimeHours", 0);
            row.put("overtimeAmount", BigDecimal.ZERO);
            result.add(row);
        }
        return result;
    }

    public List<Map<String, Object>> getCompOffRegister(Integer year) {
        List<CompOff> records = compOffRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (CompOff co : records) {
            Employee e = co.getEmployee();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("employeeCode", e.getEmployeeCode());
            row.put("employeeName", e.getFullName());
            row.put("earnedDate", co.getEarnedDate().toString());
            row.put("expiryDate", co.getExpiryDate().toString());
            row.put("status", co.getStatus());
            row.put("availedDate", co.getAvailedDate() != null ? co.getAvailedDate().toString() : "-");
            row.put("remarks", co.getRemarks() != null ? co.getRemarks() : "-");
            result.add(row);
        }
        return result;
    }
}