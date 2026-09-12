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
        List<Employee> all = employeeRepository.findAll();
        List<Employee> nonDeleted = all.stream().filter(e -> !Boolean.TRUE.equals(e.getIsDeleted())).toList();

        long total = nonDeleted.size();
        long active = nonDeleted.stream().filter(e -> "LIVE".equalsIgnoreCase(e.getEmployeeStatus())).count();
        long male = nonDeleted.stream().filter(e -> "MALE".equalsIgnoreCase(e.getGender())).count();
        long female = nonDeleted.stream().filter(e -> "FEMALE".equalsIgnoreCase(e.getGender())).count();

        // Count new employees this month
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        long newThisMonth = nonDeleted.stream()
            .filter(e -> e.getCreatedAt() != null &&
                e.getCreatedAt().toLocalDate().isAfter(startOfMonth.minusDays(1)))
            .count();

        // Status distribution (normalize to uppercase codes)
        Map<String, Long> statusDistribution = nonDeleted.stream()
            .collect(Collectors.groupingBy(
                e -> e.getEmployeeStatus() != null ? e.getEmployeeStatus().toUpperCase() : "UNKNOWN",
                Collectors.counting()));

        // Gender distribution (normalize to uppercase codes)
        Map<String, Long> genderDistribution = nonDeleted.stream()
            .collect(Collectors.groupingBy(
                e -> e.getGender() != null ? e.getGender().toUpperCase() : "UNKNOWN",
                Collectors.counting()));

        // Designation distribution
        List<DashboardStatsDTO.DesignationCount> designationCounts =
            nonDeleted.stream()
                .filter(e -> e.getDesignation() != null && !e.getDesignation().isBlank())
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
            nonDeleted.stream()
                .filter(e -> e.getAgeBracket() != null && !e.getAgeBracket().isBlank())
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
            .exitedEmployees(Math.max(0, total - active))
            .maleCount(male)
            .femaleCount(female)
            .newThisMonth(newThisMonth)
            .exitedThisMonth(0)
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
