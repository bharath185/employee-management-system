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
    private List<String> columns;
    private List<Map<String, Object>> rows;
    private int rowCount;
    private String explanation;
    private boolean success;
    private String errorMessage;
}
