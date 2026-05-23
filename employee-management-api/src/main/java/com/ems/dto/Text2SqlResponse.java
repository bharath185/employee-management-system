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
public class Text2SqlResponse {
    private String question;
    private String sql;
    private String message;
    private List<String> columns;
    private List<Map<String, Object>> rows;
    private int rowCount;
    private String explanation;
    private boolean success;
    private String errorMessage;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SqlResult {
        public List<String> columns;
        public List<Map<String, Object>> rows;
        public int rowCount;
        public String error;
    }
}
