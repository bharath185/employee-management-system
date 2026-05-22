package com.ems.service;

import com.ems.dto.DashboardStatsDTO;
import com.ems.dto.EmployeeDTO;
import com.ems.model.Employee;
import com.ems.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EmployeeRepository employeeRepository;

    public DashboardStatsDTO getStats() {
        long total = employeeRepository.countActive();
        long active = employeeRepository.countLive();
        long male = employeeRepository.countByGender("MALE");
        long female = employeeRepository.countByGender("FEMALE");

        // Count new employees this month
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        long newThisMonth = employeeRepository.findAll().stream()
            .filter(e -> e.getCreatedAt() != null &&
                e.getCreatedAt().toLocalDate().isAfter(startOfMonth.minusDays(1)))
            .count();

        // Status distribution
        Map<String, Long> statusDistribution = employeeRepository.findAll().stream()
            .filter(e -> !e.getIsDeleted())
            .collect(Collectors.groupingBy(
                e -> e.getEmployeeStatus() != null ? e.getEmployeeStatus() : "Unknown",
                Collectors.counting()));

        // Gender distribution
        Map<String, Long> genderDistribution = employeeRepository.findAll().stream()
            .filter(e -> !e.getIsDeleted())
            .collect(Collectors.groupingBy(
                e -> e.getGender() != null ? e.getGender() : "Unknown",
                Collectors.counting()));

        // Designation distribution
        List<DashboardStatsDTO.DesignationCount> designationCounts =
            employeeRepository.findAll().stream()
                .filter(e -> !e.getIsDeleted() && e.getDesignation() != null)
                .collect(Collectors.groupingBy(
                    Employee::getDesignation, Collectors.counting()))
                .entrySet().stream()
                .map(entry -> DashboardStatsDTO.DesignationCount.builder()
                    .designation(entry.getKey())
                    .count(entry.getValue())
                    .build())
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .toList();

        // Age bracket distribution
        List<DashboardStatsDTO.AgeBracketCount> ageBracketCounts =
            employeeRepository.findAll().stream()
                .filter(e -> !e.getIsDeleted() && e.getAgeBracket() != null)
                .collect(Collectors.groupingBy(
                    Employee::getAgeBracket, Collectors.counting()))
                .entrySet().stream()
                .map(entry -> DashboardStatsDTO.AgeBracketCount.builder()
                    .bracket(entry.getKey())
                    .count(entry.getValue())
                    .build())
                .sorted(Comparator.comparing(
                    DashboardStatsDTO.AgeBracketCount::getBracket))
                .toList();

        return DashboardStatsDTO.builder()
            .totalEmployees(total)
            .activeEmployees(active)
            .exitedEmployees(total - active)
            .maleCount(male)
            .femaleCount(female)
            .newThisMonth(newThisMonth)
            .exitedThisMonth(0) // Would need exit tracking
            .statusDistribution(statusDistribution)
            .genderDistribution(genderDistribution)
            .designationDistribution(designationCounts)
            .ageBracketDistribution(ageBracketCounts)
            .build();
    }

    public List<EmployeeDTO> getRecentEmployees(int limit) {
        Page<Employee> recentPage = employeeRepository.findAll(
            PageRequest.of(0, limit,
                Sort.by(Sort.Direction.DESC, "createdAt")));

        return recentPage.getContent().stream()
            .map(EmployeeDTO::fromEntity)
            .toList();
    }

    public List<DashboardStatsDTO.AgeBracketCount> getAgeBracketDistribution() {
        return getStats().getAgeBracketDistribution();
    }

    public List<DashboardStatsDTO.DesignationCount> getDesignationDistribution() {
        return getStats().getDesignationDistribution();
    }
}
