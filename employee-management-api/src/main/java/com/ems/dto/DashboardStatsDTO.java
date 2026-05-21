package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {

    private long totalEmployees;
    private long activeEmployees;
    private long exitedEmployees;
    private long maleCount;
    private long femaleCount;
    private long newThisMonth;
    private long exitedThisMonth;

    private Map<String, Long> statusDistribution;
    private Map<String, Long> genderDistribution;
    private List<DesignationCount> designationDistribution;
    private List<AgeBracketCount> ageBracketDistribution;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DesignationCount {
        private String designation;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgeBracketCount {
        private String bracket;
        private long count;
    }
}
