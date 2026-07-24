package com.ems.service;

import com.ems.exception.BadRequestException;
import com.ems.model.CompOff;
import com.ems.model.Employee;
import com.ems.repository.CompOffRepository;
import com.ems.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompOffService {

    private final CompOffRepository compOffRepository;
    private final EmployeeRepository employeeRepository;

    public List<CompOff> getCompOffs(Long employeeId) {
        if (employeeId != null) {
            return compOffRepository.findByEmployeeIdOrderByEarnedDateDesc(employeeId);
        }
        return compOffRepository.findAll();
    }

    public long getAvailableCount(Long employeeId) {
        return compOffRepository.countByEmployeeIdAndStatus(employeeId, "EARNED");
    }

    @Transactional
    public CompOff earnCompOff(Long employeeId, LocalDate earnedDate) {
        if (compOffRepository.existsByEmployeeIdAndEarnedDateAndStatus(employeeId, earnedDate, "EARNED")) {
            throw new BadRequestException("Comp-Off already earned for this date");
        }
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found"));
        CompOff compOff = CompOff.builder()
            .employee(employee)
            .earnedDate(earnedDate)
            .expiryDate(earnedDate.plusMonths(3))
            .status("EARNED")
            .build();
        return compOffRepository.save(compOff);
    }

    @Transactional
    public CompOff availCompOff(Long compOffId) {
        CompOff compOff = compOffRepository.findById(compOffId)
            .orElseThrow(() -> new RuntimeException("Comp-Off not found"));
        if (!"EARNED".equals(compOff.getStatus())) {
            throw new BadRequestException("Comp-Off is not available for availing");
        }
        compOff.setStatus("AVAILED");
        compOff.setAvailedDate(LocalDate.now());
        return compOffRepository.save(compOff);
    }

    @Transactional
    public CompOff expireCompOff(Long compOffId) {
        CompOff compOff = compOffRepository.findById(compOffId)
            .orElseThrow(() -> new RuntimeException("Comp-Off not found"));
        compOff.setStatus("EXPIRED");
        return compOffRepository.save(compOff);
    }

    @Transactional
    public int expireOverdue() {
        List<CompOff> overdue = compOffRepository
            .findByStatusAndExpiryDateBefore("EARNED", LocalDate.now());
        for (CompOff co : overdue) {
            co.setStatus("EXPIRED");
        }
        compOffRepository.saveAll(overdue);
        return overdue.size();
    }
}
