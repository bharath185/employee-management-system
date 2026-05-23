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

    private static final Pattern SQL_BLOCK = Pattern.compile(
        "SQL:\\s*((?i)SELECT\\s+.+?)(?:\n|$)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    private static final String SCHEMA_CONTEXT = """
DATABASE SCHEMA: Employee Management System

TABLE: employees
COLUMNS:
- id (BIGINT, PK)
- employee_code (VARCHAR(20), UNIQUE, NOT NULL)
- prefix (VARCHAR(5))
- first_name (VARCHAR(40))
- surname (VARCHAR(40))
- gender (VARCHAR(10)) — MALE / FEMALE
- marital_status (VARCHAR(10))
- father_husband_name (VARCHAR(40))
- f_m_h (VARCHAR(10))
- occupation_kin (VARCHAR(30))
- occupation_kin_sub (VARCHAR(40))
- ration_card (VARCHAR(5)) — YES / NO
- doj (DATE) — date of joining
- highest_qualification (VARCHAR(40))
- level_of_education (VARCHAR(20))
- year_of_passing (INTEGER)
- percentage_marks (DECIMAL(5,2))
- dob (DATE) — date of birth
- age (INTEGER)
- age_bracket (VARCHAR(15))
- present_address (VARCHAR(256))
- permanent_address (VARCHAR(256))
- email (VARCHAR(56))
- mobile (VARCHAR(15), NOT NULL)
- close_relative_name (VARCHAR(40))
- close_relative_mobile (VARCHAR(10))
- religion (VARCHAR(20))
- social_category (VARCHAR(20))
- social_subcategory (VARCHAR(20))
- has_tv (VARCHAR(5))
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
- employee_status (VARCHAR(15)) — LIVE / EXIT / SUSPENDED
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
- category (VARCHAR(40))
- code (VARCHAR(40))
- value (VARCHAR(100))
- sort_order (INTEGER)
- active (BOOLEAN)
""";

    private static final String CONVERSATIONAL_PROMPT = """
You are a friendly HR assistant for the Employee Management System.
You help users find information about employees from the database.

%s

INSTRUCTIONS:
1. Be warm, concise, and conversational.
2. For greetings (hi, hello, hey, good morning, thanks, etc.), greet back and offer help.
3. For questions about employee data, generate a SQL SELECT query.
4. When you need to query the database, write "SQL:" on its own line followed by the SQL query.
   Example:
   Let me look that up for you!
   SQL:SELECT dob FROM employees WHERE employee_code = 'EM001' AND is_deleted = false
5. If the user mentions an employee code pattern (like EM001, EMP001, EM009909, etc.),
   use it to look up specific employee information from the employees table.

KEY RULES:
- Always use snake_case column names.
- Always add WHERE is_deleted = false for employees table.
- Use UPPERCASE for enum values: 'MALE'/'FEMALE', 'LIVE'/'EXIT'.
- Only SELECT queries — never modify data.
- Use standard SQL compatible with both PostgreSQL and SQL Server.

EXAMPLES:
User: hi
Assistant: Hello! I'm your HR assistant. I can help you look up employee information — just ask me anything!

User: what is the date of birth of EM001
Assistant: Let me check that for you!
SQL:SELECT employee_code, first_name, surname, dob FROM employees WHERE employee_code = 'EM001' AND is_deleted = false

User: how many employees are there
Assistant: Let me find out!
SQL:SELECT COUNT(*) FROM employees WHERE is_deleted = false

User: show me employees in IT department
Assistant: Let me look up the IT department employees!
SQL:SELECT employee_code, first_name, surname, designation FROM employees WHERE LOWER(designation) LIKE '%it%' AND is_deleted = false

Respond naturally. When you include "SQL:", I will execute the query and show you the results.
""";

    private static final String EXPLANATION_PROMPT = """
You are a friendly HR assistant explaining database results to a user.

User question: "%s"

SQL query executed: %s

Results: %s

Explain these results to the user conversationally and concisely.
""";

    private static final List<String> GREETINGS = List.of(
        "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
        "how are you", "what's up", "sup", "yo", "greetings", "hi there",
        "hello there", "thank", "thanks", "thank you", "thanks!"
    );

    @Transactional(readOnly = true)
    public Text2SqlResponse processQuestion(String question) {
        if (question == null || question.trim().isEmpty()) {
            return Text2SqlResponse.builder()
                .success(false).errorMessage("Please ask a question!").build();
        }

        // Try LLM conversational path first
        if (hasApiKey()) {
            try {
                return processWithLlm(question);
            } catch (Exception e) {
                log.warn("LLM conversational path failed: {}", e.getMessage());
            }
        }

        // Fallback: rule-based conversational
        return processWithRules(question);
    }

    private boolean hasApiKey() {
        return (geminiApiKey != null && !geminiApiKey.isEmpty())
            || (openAiApiKey != null && !openAiApiKey.isEmpty());
    }

    // ====== LLM PATH ======

    private Text2SqlResponse processWithLlm(String question) {
        // Step 1: Get LLM response (may contain SQL or be conversational)
        String llmResponse = callLlm(question);

        // Step 2: Extract SQL if present
        String sql = extractSqlFromConversation(llmResponse);

        if (sql == null) {
            // Pure conversational response (greeting, thanks, etc.)
            return Text2SqlResponse.builder()
                .success(true)
                .question(question)
                .message(llmResponse.trim())
                .build();
        }

        // Step 3: Validate and execute SQL
        if (!SELECT_ONLY.matcher(sql).matches() || BLOCKED_KEYWORDS.matcher(sql).find()) {
            log.warn("Blocked non-SELECT query: {}", sql);
            return Text2SqlResponse.builder()
                .success(true)
                .question(question)
                .message("I'm sorry, I can only look up data, not modify it. Please ask a question that needs a SELECT query.")
                .build();
        }

        // Step 4: Execute
        Text2SqlResponse.SqlResult result = executeQuery(sql);

        // Step 5: Generate conversational explanation
        String explanation = explainResults(question, sql, result);

        return Text2SqlResponse.builder()
            .success(true)
            .question(question)
            .sql(sql)
            .message(explanation)
            .columns(result.columns)
            .rows(result.rows)
            .rowCount(result.rowCount)
            .build();
    }

    private String callLlm(String question) {
        String prompt = String.format(CONVERSATIONAL_PROMPT, SCHEMA_CONTEXT)
            + "\n\nUser: " + question + "\n\nAssistant:";

        if (geminiApiKey != null && !geminiApiKey.isEmpty()) {
            return callGemini(prompt);
        }
        return callOpenAi(prompt);
    }

    private String callGemini(String prompt) {
        Map<String, Object> contentPart = new LinkedHashMap<>();
        contentPart.put("text", prompt);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("contents", List.of(Map.of("parts", List.of(contentPart))));
        requestBody.put("generationConfig", Map.of(
            "temperature", 0.3,
            "maxOutputTokens", 800
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

        return response.getBody()
            .path("candidates").get(0)
            .path("content").path("parts").get(0)
            .path("text").asText();
    }

    private String callOpenAi(String prompt) {
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", openAiModel);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "user", "content", prompt));
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.3);
        requestBody.put("max_tokens", 800);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openAiApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<JsonNode> response = restTemplate.postForEntity(
            "https://api.openai.com/v1/chat/completions", entity, JsonNode.class);

        if (response.getBody() == null) {
            throw new RuntimeException("Empty response from OpenAI");
        }

        return response.getBody()
            .path("choices").get(0)
            .path("message").path("content").asText();
    }

    private String extractSqlFromConversation(String text) {
        if (text == null) return null;

        // Look for SQL: prefix
        var sqlMatcher = SQL_BLOCK.matcher(text);
        if (sqlMatcher.find()) {
            String sql = sqlMatcher.group(1).trim();
            // Clean up markdown backticks
            sql = sql.replaceAll("```[a-zA-Z]*\\s*", "").replaceAll("```", "").trim();
            int semiIdx = sql.indexOf(';');
            if (semiIdx >= 0) {
                sql = sql.substring(0, semiIdx).trim();
            }
            return sql;
        }

        // Fallback: find any SELECT statement
        int selectIdx = text.toUpperCase().indexOf("SELECT");
        if (selectIdx >= 0) {
            String sql = text.substring(selectIdx).trim();
            sql = sql.replaceAll("```[a-zA-Z]*\\s*", "").replaceAll("```", "").trim();
            int semiIdx = sql.indexOf(';');
            if (semiIdx >= 0) {
                sql = sql.substring(0, semiIdx).trim();
            }
            return sql;
        }

        return null;
    }

    private String explainResults(String question, String sql, Text2SqlResponse.SqlResult result) {
        // Build a readable representation of results
        String resultStr = buildResultString(result);

        String explainPrompt = String.format(EXPLANATION_PROMPT,
            question.replace("\"", "\\\""),
            sql,
            resultStr);

        try {
            if (geminiApiKey != null && !geminiApiKey.isEmpty()) {
                return callGemini(explainPrompt);
            }
            if (openAiApiKey != null && !openAiApiKey.isEmpty()) {
                return callOpenAi(explainPrompt);
            }
        } catch (Exception e) {
            log.warn("Explanation LLM call failed, using template: {}", e.getMessage());
        }

        // Fallback to template-based explanation
        return templateExplanation(question, sql, result);
    }

    // ====== FALLBACK RULE-BASED PATH ======

    private Text2SqlResponse processWithRules(String question) {
        String q = question.toLowerCase().trim();

        // Check for greetings
        if (isGreeting(q)) {
            String greeting = getGreetingResponse(q);
            return Text2SqlResponse.builder()
                .success(true)
                .question(question)
                .message(greeting)
                .build();
        }

        // Generate SQL via rules
        String sql = fallbackRuleBasedSql(question);
        if (sql == null) {
            return Text2SqlResponse.builder()
                .success(true)
                .question(question)
                .message("I'm not sure how to answer that. Try asking about employees, like \"show me employee details\" or \"how many employees are there?\"")
                .build();
        }

        // Execute and format conversational response
        Text2SqlResponse.SqlResult result = executeQuery(sql);
        String message = templateExplanation(question, sql, result);

        return Text2SqlResponse.builder()
            .success(true)
            .question(question)
            .sql(sql)
            .message(message)
            .columns(result.columns)
            .rows(result.rows)
            .rowCount(result.rowCount)
            .build();
    }

    private boolean isGreeting(String q) {
        return GREETINGS.stream().anyMatch(g -> q.contains(g) || q.equals(g));
    }

    private String getGreetingResponse(String q) {
        if (q.contains("thank") || q.contains("thanks")) {
            return "You're welcome! Feel free to ask if you need any other information about employees.";
        }
        if (q.contains("how are you")) {
            return "I'm doing great, thanks for asking! I'm your HR assistant. I can help you look up employee information, check stats, or find specific employee details. What would you like to know?";
        }
        if (q.contains("good morning")) {
            return "Good morning! I'm your HR assistant, ready to help you with employee data. What can I look up for you today?";
        }
        if (q.contains("good afternoon")) {
            return "Good afternoon! I'm your HR assistant. Is there anything about employees you'd like to check?";
        }
        if (q.contains("good evening")) {
            return "Good evening! I'm still here to help with any employee information you need. What can I do for you?";
        }
        return "Hello! I'm your HR assistant. I can help you look up employee information, run reports, or find specific employee details. Just ask me anything!";
    }

    // ====== SQL EXECUTION ======

    private Text2SqlResponse.SqlResult executeQuery(String sql) {
        Text2SqlResponse.SqlResult result = new Text2SqlResponse.SqlResult();
        try {
            Query query = entityManager.createNativeQuery(sql);
            List<?> rawResults = query.getResultList();

            List<String> columns;
            List<Map<String, Object>> rows = new ArrayList<>();

            if (!rawResults.isEmpty()) {
                Object first = rawResults.get(0);
                if (first instanceof Object[]) {
                    Object[][] arrResults = rawResults.toArray(new Object[0][]);
                    columns = extractColumnNames(sql, arrResults);
                    for (Object[] row : arrResults) {
                        Map<String, Object> rowMap = new LinkedHashMap<>();
                        for (int i = 0; i < columns.size() && i < row.length; i++) {
                            rowMap.put(columns.get(i), row[i] != null ? row[i] : "");
                        }
                        rows.add(rowMap);
                    }
                } else {
                    columns = extractColumnNames(sql, null);
                    if (columns.isEmpty()) columns = List.of("result");
                    for (Object val : rawResults) {
                        Map<String, Object> rowMap = new LinkedHashMap<>();
                        rowMap.put(columns.get(0), val != null ? val : "");
                        rows.add(rowMap);
                    }
                }
            } else {
                columns = extractColumnNames(sql, null);
                if (columns.isEmpty()) columns = List.of("result");
            }

            result.columns = columns;
            result.rows = rows;
            result.rowCount = rows.size();
            return result;

        } catch (Exception e) {
            log.error("SQL execution error: {}", e.getMessage());
            result.error = e.getMessage();
            return result;
        }
    }

    // ====== CONVERSATIONAL EXPLANATION TEMPLATES ======

    private String templateExplanation(String question, String sql, Text2SqlResponse.SqlResult result) {
        if (result.error != null) {
            return "I ran into an error while looking that up. Could you try rephrasing your question?";
        }
        if (result.rows.isEmpty()) {
            return "I couldn't find any results matching your question.";
        }

        String q = question.toLowerCase();

        // Single scalar result (e.g., COUNT)
        if (result.columns.size() == 1 && result.rows.size() == 1) {
            Object val = result.rows.get(0).get(result.columns.get(0));
            String col = result.columns.get(0).toLowerCase();
            if (col.equals("count") || col.contains("count")) {
                return "The **total is " + val + "**.";
            }
            return "Here's what I found: **" + val + "**.";
        }

        // Single employee lookup by code
        if (result.rows.size() == 1 && result.columns.contains("employee_code")) {
            Map<String, Object> row = result.rows.get(0);
            String code = String.valueOf(row.getOrDefault("employee_code", ""));
            String firstName = String.valueOf(row.getOrDefault("first_name", ""));
            String surname = String.valueOf(row.getOrDefault("surname", ""));
            String name = (firstName + " " + surname).trim();

            StringBuilder msg = new StringBuilder();
            if (!name.isBlank() && !name.equals("null")) {
                msg.append("Here are the details for **").append(name).append("** (").append(code).append("):\n");
            } else {
                msg.append("Here are the details for employee **").append(code).append("**:\n");
            }
            for (String col : result.columns) {
                if (!col.equals("employee_code") && !col.equals("first_name") && !col.equals("surname") && !col.equals("id")) {
                    Object val = row.get(col);
                    if (val != null && !val.toString().isBlank()) {
                        String label = formatColumnLabel(col);
                        msg.append("• **").append(label).append("**: ").append(val).append("\n");
                    }
                }
            }
            return msg.toString().trim();
        }

        // Multiple rows with employee code — list format
        if (result.columns.contains("employee_code") && result.rows.size() <= 10) {
            StringBuilder msg = new StringBuilder();
            msg.append("I found **").append(result.rows.size()).append("** employee(s):\n\n");
            int count = 1;
            for (Map<String, Object> row : result.rows) {
                String code = String.valueOf(row.getOrDefault("employee_code", ""));
                String firstName = String.valueOf(row.getOrDefault("first_name", ""));
                String surname = String.valueOf(row.getOrDefault("surname", ""));
                String name = (firstName + " " + surname).trim();
                msg.append(count).append(". **").append(name.isBlank() ? code : name + " (" + code + ")").append("**");
                // Show key fields
                for (String col : List.of("designation", "employee_status", "gender", "mobile")) {
                    if (result.columns.contains(col)) {
                        Object val = row.get(col);
                        if (val != null && !val.toString().isBlank()) {
                            msg.append(" — ").append(val);
                        }
                    }
                }
                msg.append("\n");
                count++;
            }
            return msg.toString().trim();
        }

        // Group by / aggregate results
        if (result.columns.stream().anyMatch(c -> c.toLowerCase().contains("count"))) {
            StringBuilder msg = new StringBuilder();
            msg.append("I found **").append(result.rows.size()).append("** category/categories:\n\n");
            for (Map<String, Object> row : result.rows) {
                String label = row.values().stream()
                    .filter(v -> v != null && !v.toString().isEmpty())
                    .filter(v -> !v.toString().matches("\\d+"))
                    .map(Object::toString)
                    .collect(Collectors.joining(" — "));
                String count = row.values().stream()
                    .filter(v -> v != null && v.toString().matches("\\d+"))
                    .map(Object::toString)
                    .findFirst().orElse("");
                msg.append("• **").append(label.isBlank() ? "N/A" : label).append("**");
                if (!count.isBlank()) msg.append(": ").append(count);
                msg.append("\n");
            }
            return msg.toString().trim();
        }

        // Default: show count with table
        if (result.rows.size() > 10) {
            return "I found **" + result.rows.size() + "** results. Here are the details in the table below.";
        }
        return "I found **" + result.rows.size() + "** result(s). Check the table below for details.";
    }

    private String buildResultString(Text2SqlResponse.SqlResult result) {
        if (result.rows.isEmpty()) return "No results found.";
        StringBuilder sb = new StringBuilder();
        for (Map<String, Object> row : result.rows) {
            sb.append(row.values().stream()
                .map(v -> v == null ? "null" : v.toString())
                .collect(Collectors.joining(", ")));
            sb.append("\n");
        }
        return sb.toString();
    }

    private String formatColumnLabel(String col) {
        return Arrays.stream(col.split("_"))
            .map(w -> Character.toUpperCase(w.charAt(0)) + w.substring(1))
            .collect(Collectors.joining(" "));
    }

    // ====== RULE-BASED SQL GENERATION ======

    private String fallbackRuleBasedSql(String question) {
        String q = question.toLowerCase().trim();

        // Extract employee code pattern
        String empCode = null;
        var codeMatcher = java.util.regex.Pattern.compile("\\b([A-Za-z]{2,10}\\d{2,10})\\b").matcher(question);
        if (codeMatcher.find()) {
            empCode = codeMatcher.group();
        }

        // Employee-code-specific queries
        if (empCode != null) {
            if (q.contains("date of birth") || q.contains("dob") || q.contains("birth date") || q.contains("birthday") || q.contains("born")) {
                return "SELECT employee_code, first_name, surname, dob FROM employees WHERE employee_code = '" + empCode + "' AND is_deleted = false";
            }
            if (q.contains("mobile") || q.contains("phone") || q.contains("contact") || q.contains("call")) {
                return "SELECT employee_code, first_name, surname, mobile, email FROM employees WHERE employee_code = '" + empCode + "' AND is_deleted = false";
            }
            if (q.contains("address") || q.contains("live") || q.contains("residence") || q.contains("stay")) {
                return "SELECT employee_code, first_name, surname, present_address, permanent_address FROM employees WHERE employee_code = '" + empCode + "' AND is_deleted = false";
            }
            if (q.contains("designation") || q.contains("role") || q.contains("position") || q.contains("job") || q.contains("work")) {
                return "SELECT employee_code, first_name, surname, designation, employee_status FROM employees WHERE employee_code = '" + empCode + "' AND is_deleted = false";
            }
            if (q.contains("bank") || q.contains("account") || q.contains("salary") || q.contains("ifsc")) {
                return "SELECT employee_code, first_name, surname, bank_name, account_number, ifsc_code FROM employees WHERE employee_code = '" + empCode + "' AND is_deleted = false";
            }
            if (q.contains("aadhar") || q.contains("pan") || q.contains("document") || q.contains("identity") || q.contains("id proof")) {
                return "SELECT employee_code, first_name, surname, aadhar_number, pan_number, aadhaar_verification, pan_verification FROM employees WHERE employee_code = '" + empCode + "' AND is_deleted = false";
            }
            if (q.contains("age") || q.contains("old")) {
                return "SELECT employee_code, first_name, surname, dob, age, age_bracket FROM employees WHERE employee_code = '" + empCode + "' AND is_deleted = false";
            }
            if (q.contains("email") || q.contains("mail")) {
                return "SELECT employee_code, first_name, surname, email FROM employees WHERE employee_code = '" + empCode + "' AND is_deleted = false";
            }
            if (q.contains("education") || q.contains("qualification") || q.contains("study") || q.contains("degree")) {
                return "SELECT employee_code, first_name, surname, highest_qualification, level_of_education, year_of_passing FROM employees WHERE employee_code = '" + empCode + "' AND is_deleted = false";
            }
            if (q.contains("gender") || q.contains("sex")) {
                return "SELECT employee_code, first_name, surname, gender FROM employees WHERE employee_code = '" + empCode + "' AND is_deleted = false";
            }
            if (q.contains("marital") || q.contains("married") || q.contains("spouse")) {
                return "SELECT employee_code, first_name, surname, marital_status, spouse_name, spouse_phone FROM employees WHERE employee_code = '" + empCode + "' AND is_deleted = false";
            }
            if (q.contains("relative") || q.contains("father") || q.contains("mother") || q.contains("family")) {
                return "SELECT employee_code, first_name, surname, father_name, father_phone, mother_name, mother_phone, spouse_name, spouse_phone, close_relative_name, close_relative_mobile FROM employees WHERE employee_code = '" + empCode + "' AND is_deleted = false";
            }
            if (q.contains("name") || q.contains("who is") || q.contains("about") || q.contains("details") || q.contains("information") || q.contains("profile")) {
                return "SELECT employee_code, first_name, surname, gender, designation, employee_status, mobile, email, doj FROM employees WHERE employee_code = '" + empCode + "' AND is_deleted = false";
            }
            if (q.contains("all") || q.contains("everything") || q.contains("full") || q.contains("complete")) {
                return "SELECT * FROM employees WHERE employee_code = '" + empCode + "' AND is_deleted = false";
            }
            // Generic — show everything for this employee
            return "SELECT employee_code, first_name, surname, gender, designation, employee_status, mobile, email, doj FROM employees WHERE employee_code = '" + empCode + "' AND is_deleted = false";
        }

        // Greetings are handled upstream, but catch any missed ones
        if (isGreeting(q)) {
            return null;
        }

        // Questions about the assistant
        if (q.contains("who are you") || q.contains("what can you") || q.contains("help")) {
            return null;
        }

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
        if (q.contains("all employee") || q.contains("list employee") || q.contains("show employee") || q.contains("everyone")) {
            return "SELECT employee_code, first_name, surname, gender, designation, employee_status, mobile, doj FROM employees WHERE is_deleted = false ORDER BY created_at DESC OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY";
        }

        // Name-based lookup
        String namePattern = extractName(question);
        if (namePattern != null) {
            return "SELECT employee_code, first_name, surname, gender, designation, employee_status, mobile FROM employees WHERE is_deleted = false AND (LOWER(first_name) LIKE '%" + namePattern + "%' OR LOWER(surname) LIKE '%" + namePattern + "%') ORDER BY first_name";
        }

        return null;
    }

    private String extractName(String question) {
        String q = question.toLowerCase().trim();
        // Patterns like "show me John's details", "where is Jane", "tell me about Bob"
        String[] patterns = {
            "(?:who is|tell me about|show|find|search|where is|about)\\s+(\\w+)",
            "(\\w+)(?:'s|s)?\\s+(?:details|info|information|profile|record)"
        };
        for (String pat : patterns) {
            var m = java.util.regex.Pattern.compile(pat, java.util.regex.Pattern.CASE_INSENSITIVE).matcher(q);
            if (m.find()) {
                String name = m.group(1).toLowerCase();
                // Skip common words that aren't names
                if (!List.of("the", "an", "my", "your", "his", "her", "all", "this", "that").contains(name)) {
                    return name;
                }
            }
        }
        return null;
    }

    // ====== COLUMN NAME EXTRACTION ======

    private List<String> extractColumnNames(String sql, Object[][] results) {
        List<String> columns = new ArrayList<>();
        String upper = sql.toUpperCase();

        int selectIdx = upper.indexOf("SELECT") + 6;
        int fromIdx = upper.indexOf("FROM");
        if (fromIdx == -1) fromIdx = sql.length();

        String selectPart = sql.substring(selectIdx, fromIdx).trim();

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

        if (results != null && results.length > 0) {
            if (columns.isEmpty() || columns.size() != results[0].length) {
                columns.clear();
                for (int i = 0; i < results[0].length; i++) {
                    columns.add("column" + (i + 1));
                }
            }
        }

        return columns;
    }

    private String extractAlias(String expr) {
        String upper = expr.toUpperCase();
        if (upper.contains(" AS ")) {
            return expr.substring(upper.lastIndexOf(" AS ") + 4).trim().replaceAll("[\"'`]", "");
        }
        if (upper.contains("COUNT") || upper.contains("SUM") || upper.contains("AVG") || upper.contains("MAX") || upper.contains("MIN")) {
            int lastSpace = expr.lastIndexOf(' ');
            if (lastSpace > 0 && lastSpace < expr.length() - 1 && !expr.endsWith(")")) {
                return expr.substring(lastSpace + 1).trim().replaceAll("[\"'`]", "");
            }
        }
        String cleaned = expr.replaceAll("[\"'`]", "");
        if (cleaned.contains(".")) {
            cleaned = cleaned.substring(cleaned.lastIndexOf('.') + 1);
        }
        return cleaned;
    }
}
