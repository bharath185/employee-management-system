package com.ems.service;

import com.ems.dto.Text2SqlResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class Text2SqlService {

    private final EntityManager entityManager;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.openai.api-key:#{null}}")
    private String openAiApiKey;

    @Value("${app.openai.model:gpt-4o-mini}")
    private String openAiModel;

    @Value("${app.gemini.api-key:#{null}}")
    private String geminiApiKey;

    @Value("${app.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    @Value("${app.db.type:postgresql}")
    private String dbType;

    private static final Pattern SELECT_ONLY = Pattern.compile(
        "^\\s*SELECT\\b.*", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    private static final Pattern BLOCKED_KEYWORDS = Pattern.compile(
        "\\b(DELETE|INSERT|UPDATE|DROP|TRUNCATE|ALTER|CREATE|EXEC|EXECUTE|CALL|MERGE|REPLACE|GRANT|REVOKE)\\b",
        Pattern.CASE_INSENSITIVE);

    private static final String SCHEMA_CONTEXT = """
DATABASE SCHEMA: Employee Management System

TABLE: employees
COLUMNS:
- id (BIGINT, PK)
- employee_code (VARCHAR(20), UNIQUE, NOT NULL)
- prefix (VARCHAR(5)) — title prefix like Mr/Ms/Mrs
- first_name (VARCHAR(40))
- surname (VARCHAR(40))
- gender (VARCHAR(10)) — MALE / FEMALE
- marital_status (VARCHAR(10))
- father_husband_name (VARCHAR(40))
- f_m_h (VARCHAR(10)) — Father/Mother/Husband code
- occupation_kin (VARCHAR(30)) — occupation of kin
- occupation_kin_sub (VARCHAR(40))
- ration_card (VARCHAR(5)) — YES / NO
- doj (DATE) — date of joining
- highest_qualification (VARCHAR(40))
- level_of_education (VARCHAR(20))
- year_of_passing (INTEGER)
- percentage_marks (DECIMAL(5,2))
- dob (DATE) — date of birth
- age (INTEGER)
- age_bracket (VARCHAR(15)) — computed: 25 & Below, 26 to 30, 31 to 35, 36 to 40, 41 to 50, 51 & Above
- present_address (VARCHAR(256))
- permanent_address (VARCHAR(256))
- email (VARCHAR(56))
- mobile (VARCHAR(15), NOT NULL)
- close_relative_name (VARCHAR(40))
- close_relative_mobile (VARCHAR(10))
- religion (VARCHAR(20))
- social_category (VARCHAR(20))
- social_subcategory (VARCHAR(20))
- has_tv (VARCHAR(5)) — YES / NO
- has_fridge (VARCHAR(5))
- has_laptop (VARCHAR(5))
- has_wifi (VARCHAR(5))
- has_2wheeler (VARCHAR(5))
- has_4wheeler (VARCHAR(5))
- blood_group (VARCHAR(5))
- aadhar_number (VARCHAR(14))
- pan_number (VARCHAR(10))
- ssc_status (VARCHAR(5))
- intermediate_status (VARCHAR(5))
- bachelors_degree (VARCHAR(5))
- masters_degree (VARCHAR(5))
- aadhaar_verification (VARCHAR(5))
- pan_verification (VARCHAR(5))
- osv (VARCHAR(5))
- remarks (VARCHAR(140))
- bank_name (VARCHAR(56))
- account_number (VARCHAR(15))
- ifsc_code (VARCHAR(11))
- branch (VARCHAR(40))
- employee_status (VARCHAR(15)) — LIVE / EXIT / SUSPENDED / etc
- process_assigned (VARCHAR(56))
- esic_no (VARCHAR(10))
- aadhar_seeding (VARCHAR(5))
- uan_no (VARCHAR(12))
- pf_no (VARCHAR(22))
- uan_activation (VARCHAR(5))
- languages_can_speak (VARCHAR(100))
- father_name (VARCHAR(20))
- father_phone (VARCHAR(10))
- mother_name (VARCHAR(20))
- mother_phone (VARCHAR(10))
- spouse_name (VARCHAR(20))
- spouse_phone (VARCHAR(10))
- past_experience (VARCHAR(5)) — YES / NO
- organization_name (VARCHAR(56))
- period_of_employment (VARCHAR(50))
- ref1_name (VARCHAR(20))
- ref1_relationship (VARCHAR(20))
- ref1_address (VARCHAR(256))
- ref1_mobile (VARCHAR(10))
- ref2_name (VARCHAR(20))
- ref2_relationship (VARCHAR(20))
- ref2_address (VARCHAR(256))
- ref2_mobile (VARCHAR(10))
- designation (VARCHAR(40))
- doe (DATE) — date of exit
- deletion_month (VARCHAR(10))
- exit_type (VARCHAR(30))
- exit_reason (VARCHAR(256))
- photo_path (VARCHAR(255))
- created_at (DATETIME)
- updated_at (DATETIME)
- created_by (VARCHAR(20))
- updated_by (VARCHAR(20))
- is_deleted (BOOLEAN, default false)

NOTE: All rows with is_deleted = true are soft-deleted and should be excluded.
Default filter: WHERE is_deleted = false (applied automatically by Hibernate).

TABLE: pending_registrations
COLUMNS:
- id (BIGINT, PK)
- first_name (VARCHAR(40))
- surname (VARCHAR(40))
- gender (VARCHAR(10))
- dob (DATE)
- email (VARCHAR(56))
- mobile (VARCHAR(15))
- present_address (VARCHAR(256))
- highest_qualification (VARCHAR(40))
- past_experience (VARCHAR(5))
- reference_source (VARCHAR(40))
- status (VARCHAR(20)) — PENDING / APPROVED / REJECTED
- photo_path (VARCHAR(255))
- created_at (DATETIME)

TABLE: master_data
COLUMNS:
- id (BIGINT, PK)
- category (VARCHAR(40)) — category name like GENDER, DESIGNATION, EMPLOYEE_STATUS, etc
- code (VARCHAR(40)) — stored code value
- value (VARCHAR(100)) — display value
- sort_order (INTEGER)
- active (BOOLEAN)

IMPORTANT RULES:
1. Always use snake_case column names as shown above.
2. Always add "WHERE is_deleted = false" for employees table unless counting all records.
3. Use UPPERCASE for comparisons with employee_status (e.g., 'LIVE' not 'Live').
4. Use UPPERCASE for gender comparisons (e.g., 'MALE' not 'Male').
5. Return only SELECT statements — never modify data.
6. Use standard SQL compatible with both PostgreSQL and SQL Server.
7. For counting, use COUNT(*).
8. Use GROUP BY for aggregations.
9. Use ORDER BY for sorting results.
10. Limit results to 100 rows maximum unless user asks for more.
11. Use LIKE for text search with '%' wildcard.
12. JOIN with master_data when display values are needed (e.g., join on master_data.code = employees.gender AND master_data.category = 'GENDER').

Return ONLY the SQL query, no explanations, no markdown formatting.
""";

    @Transactional(readOnly = true)
    public Text2SqlResponse processQuestion(String question) {
        if (question == null || question.trim().isEmpty()) {
            return Text2SqlResponse.builder()
                .success(false).errorMessage("Question cannot be empty").build();
        }

        // Step 1: Generate SQL via LLM
        String sql;
        try {
            sql = generateSql(question);
        } catch (Exception e) {
            log.error("Failed to generate SQL: {}", e.getMessage());
            return Text2SqlResponse.builder()
                .success(false).question(question)
                .errorMessage("Failed to generate SQL: " + e.getMessage()).build();
        }

        if (sql == null || sql.trim().isEmpty()) {
            return Text2SqlResponse.builder()
                .success(false).question(question)
                .errorMessage("Could not generate a valid SQL query").build();
        }

        // Step 2: Validate it's SELECT-only
        if (!SELECT_ONLY.matcher(sql).matches() || BLOCKED_KEYWORDS.matcher(sql).find()) {
            log.warn("Blocked non-SELECT query: {}", sql);
            return Text2SqlResponse.builder()
                .success(false).question(question).sql(sql)
                .errorMessage("Only SELECT queries are allowed").build();
        }

        // Step 3: Execute
        try {
            Query query = entityManager.createNativeQuery(sql);
            query.setMaxResults(200);
            @SuppressWarnings("unchecked")
            List<Object[]> rawResults = query.getResultList();

            // Extract column names from the query metadata
            List<String> columns = extractColumnNames(sql, rawResults);

            // Map rows
            List<Map<String, Object>> rows = new ArrayList<>();
            for (Object[] row : rawResults) {
                Map<String, Object> rowMap = new LinkedHashMap<>();
                for (int i = 0; i < columns.size() && i < row.length; i++) {
                    rowMap.put(columns.get(i), row[i]);
                }
                rows.add(rowMap);
            }

            return Text2SqlResponse.builder()
                .success(true)
                .question(question)
                .sql(sql)
                .columns(columns)
                .rows(rows)
                .rowCount(rows.size())
                .explanation(generateExplanation(question, sql, rows.size()))
                .build();

        } catch (Exception e) {
            log.error("SQL execution error: {}", e.getMessage());
            return Text2SqlResponse.builder()
                .success(false).question(question).sql(sql)
                .errorMessage("Error executing query: " + e.getMessage()).build();
        }
    }

    private String generateSql(String question) {
        // Try Gemini first (free tier), then OpenAI, then fallback rules
        if (geminiApiKey != null && !geminiApiKey.isEmpty()) {
            try {
                return callGemini(question);
            } catch (Exception e) {
                log.warn("Gemini call failed: {}", e.getMessage());
            }
        }
        if (openAiApiKey != null && !openAiApiKey.isEmpty()) {
            try {
                return callOpenAi(question);
            } catch (Exception e) {
                log.warn("OpenAI call failed: {}", e.getMessage());
            }
        }
        return fallbackRuleBasedSql(question);
    }

    private String callGemini(String question) {
        String prompt = SCHEMA_CONTEXT + "\n\nUser question: " + question + "\n\nSQL:";

        Map<String, Object> contentPart = new LinkedHashMap<>();
        contentPart.put("text", "You are a SQL expert. Convert natural language to SQL for the employee management DB. " +
            "Use " + dbType + " compatible syntax. Return ONLY raw SQL — no markdown, no backticks.\n\n" + prompt);

        Map<String, Object> part = Map.of("parts", List.of(contentPart));

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("contents", List.of(Map.of("parts", List.of(contentPart))));
        requestBody.put("generationConfig", Map.of(
            "temperature", 0.1,
            "maxOutputTokens", 500
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<JsonNode> response = restTemplate.postForEntity(
            "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey,
            entity, JsonNode.class);

        if (response.getBody() == null) {
            throw new RuntimeException("Empty response from Gemini");
        }

        String text = response.getBody()
            .path("candidates").get(0)
            .path("content").path("parts").get(0)
            .path("text").asText();

        text = text.replaceAll("```sql\\s*", "")
            .replaceAll("```\\s*", "")
            .trim();

        return text;
    }

    private String callOpenAi(String question) {
        String prompt = SCHEMA_CONTEXT + "\n\nUser question: " + question + "\n\nSQL:";

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", openAiModel);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
            "You are a SQL expert. Convert natural language questions to SQL queries for the employee management database. " +
            "Return ONLY the raw SQL query — no markdown, no backticks, no explanations."));
        messages.add(Map.of("role", "user", "content", prompt));
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.1);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openAiApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<JsonNode> response = restTemplate.postForEntity(
            "https://api.openai.com/v1/chat/completions", entity, JsonNode.class);

        if (response.getBody() == null) {
            throw new RuntimeException("Empty response from OpenAI");
        }

        String content = response.getBody()
            .path("choices").get(0)
            .path("message").path("content").asText();

        content = content.replaceAll("```sql\\s*", "")
            .replaceAll("```\\s*", "")
            .trim();

        return content;
    }

    private String fallbackRuleBasedSql(String question) {
        String q = question.toLowerCase().trim();

        // Simple rule-based fallback for common questions
        if (q.contains("total employee") || q.contains("how many employee") || q.contains("count of employee")) {
            return "SELECT COUNT(*) as count FROM employees WHERE is_deleted = false";
        }
        if (q.contains("active") || q.contains("live")) {
            return "SELECT COUNT(*) as count FROM employees WHERE employee_status = 'LIVE' AND is_deleted = false";
        }
        if ((q.contains("male") || q.contains("men") || q.contains("boy")) && !q.contains("female") && !q.contains("women")) {
            return "SELECT COUNT(*) as count FROM employees WHERE gender = 'MALE' AND is_deleted = false";
        }
        if (q.contains("female") || q.contains("women") || q.contains("girl")) {
            return "SELECT COUNT(*) as count FROM employees WHERE gender = 'FEMALE' AND is_deleted = false";
        }
        if ((q.contains("recent") || q.contains("new") || q.contains("latest") || q.contains("last")) && !q.contains("month")) {
            return "SELECT employee_code, first_name, surname, designation, doj, employee_status FROM employees WHERE is_deleted = false ORDER BY created_at DESC OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY";
        }
        if (q.contains("designation")) {
            return "SELECT designation, COUNT(*) as count FROM employees WHERE is_deleted = false AND designation IS NOT NULL GROUP BY designation ORDER BY count DESC";
        }
        if (q.contains("age") && (q.contains("bracket") || q.contains("group") || q.contains("distribution"))) {
            return "SELECT age_bracket, COUNT(*) as count FROM employees WHERE is_deleted = false AND age_bracket IS NOT NULL GROUP BY age_bracket ORDER BY age_bracket";
        }
        if (q.contains("exit") || q.contains("left") || q.contains("resign") || q.contains("depart")) {
            return "SELECT COUNT(*) as count FROM employees WHERE employee_status != 'LIVE' AND is_deleted = false";
        }
        if (q.contains("process") || q.contains("department")) {
            return "SELECT process_assigned, COUNT(*) as count FROM employees WHERE is_deleted = false AND process_assigned IS NOT NULL GROUP BY process_assigned ORDER BY count DESC";
        }
        if (q.contains("bank") || q.contains("account")) {
            return "SELECT employee_code, first_name, surname, bank_name, account_number, ifsc_code FROM employees WHERE is_deleted = false AND bank_name IS NOT NULL ORDER BY employee_code";
        }
        if (q.contains("education") || q.contains("qualification") || q.contains("degree")) {
            return "SELECT highest_qualification, COUNT(*) as count FROM employees WHERE is_deleted = false AND highest_qualification IS NOT NULL GROUP BY highest_qualification ORDER BY count DESC";
        }
        if (q.contains("religion")) {
            return "SELECT religion, COUNT(*) as count FROM employees WHERE is_deleted = false AND religion IS NOT NULL GROUP BY religion ORDER BY count DESC";
        }
        if (q.contains("social") && (q.contains("category") || q.contains("caste"))) {
            return "SELECT social_category, social_subcategory, COUNT(*) as count FROM employees WHERE is_deleted = false AND social_category IS NOT NULL GROUP BY social_category, social_subcategory ORDER BY count DESC";
        }
        if (q.contains("experience") || q.contains("past")) {
            return "SELECT past_experience, COUNT(*) as count FROM employees WHERE is_deleted = false AND past_experience IS NOT NULL GROUP BY past_experience";
        }
        if (q.contains("blood")) {
            return "SELECT blood_group, COUNT(*) as count FROM employees WHERE is_deleted = false AND blood_group IS NOT NULL GROUP BY blood_group ORDER BY blood_group";
        }
        if (q.contains("aadhar") || q.contains("aadhaar")) {
            return "SELECT employee_code, first_name, surname, aadhar_number, aadhaar_verification FROM employees WHERE is_deleted = false AND aadhar_number IS NOT NULL ORDER BY employee_code";
        }
        if (q.contains("pan")) {
            return "SELECT employee_code, first_name, surname, pan_number, pan_verification FROM employees WHERE is_deleted = false AND pan_number IS NOT NULL ORDER BY employee_code";
        }
        if (q.contains("pending") && (q.contains("registration") || q.contains("reg"))) {
            return "SELECT id, first_name, surname, gender, mobile, email, status, created_at FROM pending_registrations WHERE status = 'PENDING' ORDER BY created_at DESC";
        }
        if (q.contains("approved") && (q.contains("registration") || q.contains("reg"))) {
            return "SELECT id, first_name, surname, gender, mobile, email, status, created_at FROM pending_registrations WHERE status = 'APPROVED' ORDER BY created_at DESC";
        }
        if (q.contains("married") || q.contains("marital") || q.contains("single")) {
            return "SELECT marital_status, COUNT(*) as count FROM employees WHERE is_deleted = false AND marital_status IS NOT NULL GROUP BY marital_status";
        }
        if (q.contains("skill") || q.contains("language")) {
            return "SELECT employee_code, first_name, surname, languages_can_speak FROM employees WHERE is_deleted = false AND languages_can_speak IS NOT NULL ORDER BY employee_code";
        }
        if (q.contains("reference") || q.contains("ref")) {
            return "SELECT employee_code, first_name, surname, ref1_name, ref1_relationship, ref2_name, ref2_relationship FROM employees WHERE is_deleted = false AND ref1_name IS NOT NULL ORDER BY employee_code";
        }
        if (q.contains("pf") || q.contains("provident") || q.contains("uan")) {
            return "SELECT employee_code, first_name, surname, uan_no, pf_no, uan_activation FROM employees WHERE is_deleted = false AND (uan_no IS NOT NULL OR pf_no IS NOT NULL) ORDER BY employee_code";
        }
        if (q.contains("esic")) {
            return "SELECT employee_code, first_name, surname, esic_no FROM employees WHERE is_deleted = false AND esic_no IS NOT NULL ORDER BY employee_code";
        }
        if (q.contains("new") && q.contains("month")) {
            return "SELECT COUNT(*) as count FROM employees WHERE is_deleted = false AND created_at >= DATE_TRUNC('month', CURRENT_DATE)";
        }
        if (q.contains("gender")) {
            return "SELECT gender, COUNT(*) as count FROM employees WHERE is_deleted = false AND gender IS NOT NULL GROUP BY gender";
        }
        if (q.contains("member") || q.contains("people") || q.contains("worker") || q.contains("staff")) {
            return "SELECT COUNT(*) as count FROM employees WHERE is_deleted = false";
        }

        return "SELECT employee_code, first_name, surname, gender, designation, employee_status, mobile, doj FROM employees WHERE is_deleted = false ORDER BY created_at DESC OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY";
    }

    private List<String> extractColumnNames(String sql, List<Object[]> results) {
        // Try to extract aliases from SQL
        List<String> columns = new ArrayList<>();
        String upper = sql.toUpperCase();

        // Extract between SELECT and FROM
        int selectIdx = upper.indexOf("SELECT") + 6;
        int fromIdx = upper.indexOf("FROM");
        if (fromIdx == -1) fromIdx = sql.length();

        String selectPart = sql.substring(selectIdx, fromIdx).trim();

        // Split by commas respecting nested parens
        int depth = 0;
        StringBuilder current = new StringBuilder();
        for (char c : selectPart.toCharArray()) {
            if (c == '(') depth++;
            else if (c == ')') depth--;
            else if (c == ',' && depth == 0) {
                columns.add(extractAlias(current.toString().trim()));
                current = new StringBuilder();
                continue;
            }
            current.append(c);
        }
        if (!current.toString().isBlank()) {
            columns.add(extractAlias(current.toString().trim()));
        }

        // Fallback: if no columns extracted or count mismatch, use generic names
        if (columns.isEmpty() || (results.size() > 0 && columns.size() != results.get(0).length)) {
            columns.clear();
            for (int i = 0; i < results.get(0).length; i++) {
                columns.add("column" + (i + 1));
            }
        }

        return columns;
    }

    private String extractAlias(String expr) {
        // Handle "COUNT(*) as count", "column_name alias", etc.
        String upper = expr.toUpperCase();
        if (upper.contains(" AS ")) {
            return expr.substring(upper.lastIndexOf(" AS ") + 4).trim().replaceAll("[\"'`]", "");
        }
        // Check for implicit alias (space-separated after function)
        if (upper.contains("COUNT") || upper.contains("SUM") || upper.contains("AVG") || upper.contains("MAX") || upper.contains("MIN")) {
            int lastSpace = expr.lastIndexOf(' ');
            if (lastSpace > 0 && lastSpace < expr.length() - 1 && !expr.endsWith(")")) {
                return expr.substring(lastSpace + 1).trim().replaceAll("[\"'`]", "");
            }
        }
        // Return the last part after dot
        String cleaned = expr.replaceAll("[\"'`]", "");
        if (cleaned.contains(".")) {
            cleaned = cleaned.substring(cleaned.lastIndexOf('.') + 1);
        }
        return cleaned;
    }

    private String generateExplanation(String question, String sql, int rowCount) {
        if (rowCount == 0) {
            return "No results found for your query.";
        }
        String q = question.toLowerCase();
        if (q.contains("how many") || q.contains("count")) {
            return "Found " + rowCount + " record(s).";
        }
        return "Found " + rowCount + " result(s). Showing data for: " + question;
    }
}
