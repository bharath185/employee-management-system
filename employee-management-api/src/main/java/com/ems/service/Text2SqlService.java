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

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Intelligent Local CPU-Based Natural Language Query Engine for Employee Management System.
 * Works 100% offline without requiring any GPU or external API keys, while retaining optional LLM support.
 */
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

    private static final Pattern SELECT_ONLY = Pattern.compile(
        "^\\s*SELECT\\b.*", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    private static final Pattern BLOCKED_KEYWORDS = Pattern.compile(
        "\\b(DELETE|INSERT|UPDATE|DROP|TRUNCATE|ALTER|CREATE|EXEC|EXECUTE|CALL|MERGE|REPLACE|GRANT|REVOKE)\\b",
        Pattern.CASE_INSENSITIVE);

    private static final Pattern SQL_BLOCK = Pattern.compile(
        "SQL:\\s*((?i)SELECT\\s+.+?)(?:\n|$)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    private static final Pattern EMP_CODE_PATTERN = Pattern.compile("\\b([A-Za-z]{2,8}\\d{2,8})\\b", Pattern.CASE_INSENSITIVE);

    private static final List<String> GREETINGS = List.of(
        "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
        "how are you", "what's up", "sup", "yo", "greetings", "hi there",
        "hello there", "thank", "thanks", "thank you", "thanks!", "namaste"
    );

    @Transactional(readOnly = true)
    public Text2SqlResponse processQuestion(String question) {
        if (question == null || question.trim().isEmpty()) {
            return Text2SqlResponse.builder()
                .success(false)
                .errorMessage("Please ask a question!")
                .build();
        }

        // Try LLM if API key is provided
        if (hasApiKey()) {
            try {
                Text2SqlResponse llmRes = processWithLlm(question);
                if (llmRes != null && llmRes.isSuccess() && llmRes.getMessage() != null && !llmRes.getMessage().isBlank()) {
                    return llmRes;
                }
            } catch (Exception e) {
                log.warn("LLM query processing failed, falling back to local engine: {}", e.getMessage());
            }
        }

        // Fast & Intelligent Local Rule Engine (100% CPU, No API Key, No GPU)
        return processWithLocalEngine(question);
    }

    private boolean hasApiKey() {
        return (geminiApiKey != null && !geminiApiKey.trim().isEmpty())
            || (openAiApiKey != null && !openAiApiKey.trim().isEmpty());
    }

    // =========================================================================
    // LOCAL INTELLIGENT RULE & SEMANTIC SQL ENGINE
    // =========================================================================

    private Text2SqlResponse processWithLocalEngine(String question) {
        String q = question.toLowerCase().trim();

        // 1. Greetings & System Help
        if (isGreeting(q)) {
            return Text2SqlResponse.builder()
                .success(true)
                .question(question)
                .message(getGreetingResponse(q))
                .build();
        }

        if (q.contains("help") || q.contains("what can you do") || q.contains("who are you") || q.contains("features")) {
            return Text2SqlResponse.builder()
                .success(true)
                .question(question)
                .message(getHelpResponse())
                .build();
        }

        // 2. EMS Workflow & Policy FAQs (COG/COT, Attendance locking, Holidays by Process, Processes)
        String policyMsg = getPolicyExplanation(q);
        if (policyMsg != null) {
            return Text2SqlResponse.builder()
                .success(true)
                .question(question)
                .message(policyMsg)
                .build();
        }

        // 3. Build SQL using local semantic query generator
        String sql = buildLocalSql(question);

        if (sql == null) {
            return Text2SqlResponse.builder()
                .success(true)
                .question(question)
                .message("🤔 I couldn't find a direct database match for your question.\n\n" +
                         "**Try asking about:**\n" +
                         "- **Attendance**: *'Who is absent today?'*, *'Attendance of PARI0002'*, *'Who earned comp off COG?'*\n" +
                         "- **Leaves**: *'Leave balance of PARI0001'*, *'Pending leave applications'*\n" +
                         "- **Salaries**: *'Salary of Ramesh'*, *'Total payroll cost for August'*\n" +
                         "- **Employees**: *'Employees in Housing Loan'*, *'Total active employees'*\n" +
                         "- **Holidays**: *'Upcoming holidays'*, *'Holidays in September'*\n" +
                         "- **Rules**: *'How does COG work?'*, *'How to add holiday by process?'*")
                .build();
        }

        // 3. Execute query safely
        Text2SqlResponse.SqlResult result = executeQuery(sql);

        // 4. Generate intelligent markdown formatted explanation
        String message = formatIntelligentResponse(question, sql, result);

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

    private String buildLocalSql(String question) {
        String q = question.toLowerCase().trim();
        String empCode = extractEmployeeCode(question);
        String personName = extractName(question);
        LocalDate targetDate = extractDate(question);
        String targetDateStr = targetDate != null ? targetDate.toString() : "CURRENT_DATE";
        Integer targetMonth = extractMonth(question);
        Integer targetYear = extractYear(question);
        if (targetYear == null) targetYear = LocalDate.now().getYear();

        // ==========================================
        // A. ATTENDANCE & COMP-OFF QUERIES
        // ==========================================

        // 1. Comp Off Given (COG) & Comp Off Taken (COT)
        if (q.contains("cog") || q.contains("comp off given") || q.contains("earned comp off") || q.contains("got comp off") || q.contains("comp-off earned") || q.contains("comp off earned")) {
            if (empCode != null) {
                return "SELECT e.employee_code, e.first_name, e.surname, a.attendance_date, a.status " +
                       "FROM attendance_records a JOIN employees e ON a.employee_id = e.id " +
                       "WHERE UPPER(e.employee_code) = '" + empCode.toUpperCase() + "' AND a.status = 'COG' AND e.is_deleted = false " +
                       "ORDER BY a.attendance_date DESC LIMIT 20";
            }
            return "SELECT e.employee_code, e.first_name, e.surname, e.process_assigned, a.attendance_date, a.status " +
                   "FROM attendance_records a JOIN employees e ON a.employee_id = e.id " +
                   "WHERE a.status = 'COG' AND e.is_deleted = false " +
                   "ORDER BY a.attendance_date DESC LIMIT 30";
        }

        if (q.contains("cot") || q.contains("comp off taken") || q.contains("availed comp off") || q.contains("used comp off") || q.contains("comp-off taken")) {
            if (empCode != null) {
                return "SELECT e.employee_code, e.first_name, e.surname, a.attendance_date, a.status " +
                       "FROM attendance_records a JOIN employees e ON a.employee_id = e.id " +
                       "WHERE UPPER(e.employee_code) = '" + empCode.toUpperCase() + "' AND a.status = 'COT' AND e.is_deleted = false " +
                       "ORDER BY a.attendance_date DESC LIMIT 20";
            }
            return "SELECT e.employee_code, e.first_name, e.surname, e.process_assigned, a.attendance_date, a.status " +
                   "FROM attendance_records a JOIN employees e ON a.employee_id = e.id " +
                   "WHERE a.status = 'COT' AND e.is_deleted = false " +
                   "ORDER BY a.attendance_date DESC LIMIT 30";
        }

        // Comp Off Ledger table
        if (q.contains("comp off") || q.contains("compoff") || q.contains("comp-off")) {
            if (empCode != null) {
                return "SELECT e.employee_code, e.first_name, e.surname, c.earned_date, c.availed_date, c.expiry_date, c.status, c.remarks " +
                       "FROM comp_offs c JOIN employees e ON c.employee_id = e.id " +
                       "WHERE UPPER(e.employee_code) = '" + empCode.toUpperCase() + "' AND e.is_deleted = false " +
                       "ORDER BY c.earned_date DESC LIMIT 20";
            }
            if (q.contains("available") || q.contains("balance") || q.contains("remaining")) {
                return "SELECT e.employee_code, e.first_name, e.surname, e.process_assigned, c.earned_date, c.expiry_date, c.status " +
                       "FROM comp_offs c JOIN employees e ON c.employee_id = e.id " +
                       "WHERE c.status = 'AVAILABLE' AND e.is_deleted = false " +
                       "ORDER BY c.earned_date DESC LIMIT 30";
            }
            return "SELECT e.employee_code, e.first_name, e.surname, c.earned_date, c.availed_date, c.status, c.remarks " +
                   "FROM comp_offs c JOIN employees e ON c.employee_id = e.id " +
                   "WHERE e.is_deleted = false ORDER BY c.created_at DESC LIMIT 30";
        }

        // 2. Who is Absent / Present / On Leave Today or on specific date
        if (q.contains("absent") || q.contains("not present") || q.contains("not come")) {
            String dateFilter = targetDate != null ? "a.attendance_date = '" + targetDateStr + "'" : "a.attendance_date = (SELECT MAX(attendance_date) FROM attendance_records)";
            if (empCode != null) {
                return "SELECT e.employee_code, e.first_name, e.surname, a.attendance_date, a.status " +
                       "FROM attendance_records a JOIN employees e ON a.employee_id = e.id " +
                       "WHERE UPPER(e.employee_code) = '" + empCode.toUpperCase() + "' AND a.status = 'A' AND e.is_deleted = false " +
                       "ORDER BY a.attendance_date DESC LIMIT 20";
            }
            return "SELECT e.employee_code, e.first_name, e.surname, e.process_assigned, e.designation, e.mobile, a.attendance_date, a.status " +
                   "FROM attendance_records a JOIN employees e ON a.employee_id = e.id " +
                   "WHERE a.status = 'A' AND " + dateFilter + " AND e.is_deleted = false " +
                   "ORDER BY e.first_name LIMIT 50";
        }

        if (q.contains("present") && !q.contains("present address") && !q.contains("presentation")) {
            String dateFilter = targetDate != null ? "a.attendance_date = '" + targetDateStr + "'" : "a.attendance_date = (SELECT MAX(attendance_date) FROM attendance_records)";
            if (empCode != null) {
                return "SELECT e.employee_code, e.first_name, e.surname, a.attendance_date, a.status " +
                       "FROM attendance_records a JOIN employees e ON a.employee_id = e.id " +
                       "WHERE UPPER(e.employee_code) = '" + empCode.toUpperCase() + "' AND a.status = 'P' AND e.is_deleted = false " +
                       "ORDER BY a.attendance_date DESC LIMIT 20";
            }
            if (q.contains("count") || q.contains("how many") || q.contains("total")) {
                return "SELECT COUNT(*) as count FROM attendance_records a JOIN employees e ON a.employee_id = e.id " +
                       "WHERE a.status = 'P' AND " + dateFilter + " AND e.is_deleted = false";
            }
            return "SELECT e.employee_code, e.first_name, e.surname, e.process_assigned, e.designation, a.attendance_date, a.status " +
                   "FROM attendance_records a JOIN employees e ON a.employee_id = e.id " +
                   "WHERE a.status = 'P' AND " + dateFilter + " AND e.is_deleted = false " +
                   "ORDER BY e.first_name LIMIT 50";
        }

        // Attendance stats / records for an employee
        if (empCode != null && (q.contains("attendance") || q.contains("present") || q.contains("status") || q.contains("working days"))) {
            return "SELECT a.attendance_date, a.status, a.locked " +
                   "FROM attendance_records a JOIN employees e ON a.employee_id = e.id " +
                   "WHERE UPPER(e.employee_code) = '" + empCode.toUpperCase() + "' AND e.is_deleted = false " +
                   "ORDER BY a.attendance_date DESC LIMIT 31";
        }

        // Attendance summary / breakdown by status
        if (q.contains("attendance") && (q.contains("summary") || q.contains("breakdown") || q.contains("count") || q.contains("stats") || q.contains("overview"))) {
            return "SELECT a.status, COUNT(*) as count " +
                   "FROM attendance_records a JOIN employees e ON a.employee_id = e.id " +
                   "WHERE a.attendance_date = (SELECT MAX(attendance_date) FROM attendance_records) AND e.is_deleted = false " +
                   "GROUP BY a.status ORDER BY count DESC";
        }

        // ==========================================
        // B. LEAVE BALANCES & LEAVE APPLICATIONS
        // ==========================================

        // 1. Leave Balances
        if (q.contains("leave balance") || q.contains("leave balances") || q.contains("balance leave") || q.contains("remaining leave") || (q.contains("leave") && q.contains("balance"))) {
            if (empCode != null) {
                return "SELECT e.employee_code, e.first_name, e.surname, lt.name as leave_type, lb.year, lb.entitled, lb.taken, lb.balance, lb.encashed " +
                       "FROM leave_balances lb " +
                       "JOIN employees e ON lb.employee_id = e.id " +
                       "JOIN leave_types lt ON lb.leave_type_id = lt.id " +
                       "WHERE UPPER(e.employee_code) = '" + empCode.toUpperCase() + "' AND lb.year = " + targetYear + " AND e.is_deleted = false " +
                       "ORDER BY lt.name";
            }
            if (personName != null) {
                return "SELECT e.employee_code, e.first_name, e.surname, lt.name as leave_type, lb.year, lb.entitled, lb.taken, lb.balance " +
                       "FROM leave_balances lb " +
                       "JOIN employees e ON lb.employee_id = e.id " +
                       "JOIN leave_types lt ON lb.leave_type_id = lt.id " +
                       "WHERE (LOWER(e.first_name) LIKE '%" + personName + "%' OR LOWER(e.surname) LIKE '%" + personName + "%') " +
                       "AND lb.year = " + targetYear + " AND e.is_deleted = false ORDER BY lt.name";
            }
            return "SELECT e.employee_code, e.first_name, e.surname, lt.name as leave_type, lb.entitled, lb.taken, lb.balance " +
                   "FROM leave_balances lb " +
                   "JOIN employees e ON lb.employee_id = e.id " +
                   "JOIN leave_types lt ON lb.leave_type_id = lt.id " +
                   "WHERE lb.year = " + targetYear + " AND e.is_deleted = false " +
                   "ORDER BY e.employee_code, lt.name LIMIT 40";
        }

        // Specific Leave Types: CL, PL, SL, Casual Leave, Sick Leave, Paid Leave
        if (q.contains("casual leave") || q.contains(" cl ") || q.endsWith(" cl") || q.contains("sick leave") || q.contains(" sl ") || q.endsWith(" sl") || q.contains("privilege leave") || q.contains("paid leave") || q.contains(" pl ") || q.endsWith(" pl")) {
            String leaveType = "CL";
            if (q.contains("sick") || q.contains("sl")) leaveType = "SL";
            if (q.contains("privilege") || q.contains("paid") || q.contains("pl")) leaveType = "PL";

            if (empCode != null) {
                return "SELECT e.employee_code, e.first_name, e.surname, lt.name as leave_type, lb.entitled, lb.taken, lb.balance " +
                       "FROM leave_balances lb " +
                       "JOIN employees e ON lb.employee_id = e.id " +
                       "JOIN leave_types lt ON lb.leave_type_id = lt.id " +
                       "WHERE UPPER(e.employee_code) = '" + empCode.toUpperCase() + "' AND UPPER(lt.name) = '" + leaveType + "' AND lb.year = " + targetYear + " AND e.is_deleted = false";
            }
            return "SELECT e.employee_code, e.first_name, e.surname, e.process_assigned, lt.name as leave_type, lb.entitled, lb.taken, lb.balance " +
                   "FROM leave_balances lb " +
                   "JOIN employees e ON lb.employee_id = e.id " +
                   "JOIN leave_types lt ON lb.leave_type_id = lt.id " +
                   "WHERE UPPER(lt.name) = '" + leaveType + "' AND lb.year = " + targetYear + " AND e.is_deleted = false LIMIT 30";
        }

        // 2. Leave Applications & Requests
        if (q.contains("leave application") || q.contains("applied leave") || q.contains("pending leave") || (q.contains("leave") && (q.contains("pending") || q.contains("approved") || q.contains("apply") || q.contains("requested")))) {
            String statusFilter = "";
            if (q.contains("pending")) statusFilter = "AND la.status = 'PENDING'";
            if (q.contains("approved")) statusFilter = "AND la.status = 'APPROVED'";
            if (q.contains("rejected")) statusFilter = "AND la.status = 'REJECTED'";

            if (empCode != null) {
                return "SELECT e.employee_code, e.first_name, e.surname, lt.name as leave_type, la.from_date, la.to_date, la.days, la.status, la.reason " +
                       "FROM leave_applications la " +
                       "JOIN employees e ON la.employee_id = e.id " +
                       "JOIN leave_types lt ON la.leave_type_id = lt.id " +
                       "WHERE UPPER(e.employee_code) = '" + empCode.toUpperCase() + "' " + statusFilter + " AND e.is_deleted = false " +
                       "ORDER BY la.created_at DESC LIMIT 20";
            }
            return "SELECT e.employee_code, e.first_name, e.surname, e.process_assigned, lt.name as leave_type, la.from_date, la.to_date, la.days, la.status, la.reason " +
                   "FROM leave_applications la " +
                   "JOIN employees e ON la.employee_id = e.id " +
                   "JOIN leave_types lt ON la.leave_type_id = lt.id " +
                   "WHERE e.is_deleted = false " + statusFilter + " " +
                   "ORDER BY la.created_at DESC LIMIT 30";
        }

        // ==========================================
        // C. SALARY, PAYROLL & PAYSLIPS
        // ==========================================

        if (q.contains("salary") || q.contains("payslip") || q.contains("payroll") || q.contains("net pay") || q.contains("gross pay") || q.contains("ctc") || q.contains("basic pay") || q.contains("deduction") || q.contains("allowance")) {
            if (empCode != null) {
                return "SELECT e.employee_code, e.first_name, e.surname, p.wage_month, p.wage_year, p.basic, p.hra, p.other_allowance, p.gross_salary, p.pf_deduction, p.esi_deduction, p.total_deductions, p.net_pay, p.present_days " +
                       "FROM payslips p JOIN employees e ON p.employee_id = e.id " +
                       "WHERE UPPER(e.employee_code) = '" + empCode.toUpperCase() + "' AND e.is_deleted = false " +
                       "ORDER BY p.wage_year DESC, p.wage_month DESC LIMIT 6";
            }
            if (personName != null) {
                return "SELECT e.employee_code, e.first_name, e.surname, p.wage_month, p.wage_year, p.basic, p.hra, p.gross_salary, p.total_deductions, p.net_pay " +
                       "FROM payslips p JOIN employees e ON p.employee_id = e.id " +
                       "WHERE (LOWER(e.first_name) LIKE '%" + personName + "%' OR LOWER(e.surname) LIKE '%" + personName + "%') AND e.is_deleted = false " +
                       "ORDER BY p.wage_year DESC, p.wage_month DESC LIMIT 6";
            }
            if (q.contains("highest") || q.contains("max") || q.contains("top paid") || q.contains("top salary")) {
                return "SELECT e.employee_code, e.first_name, e.surname, e.designation, e.process_assigned, p.gross_salary, p.net_pay, p.wage_month, p.wage_year " +
                       "FROM payslips p JOIN employees e ON p.employee_id = e.id " +
                       "WHERE e.is_deleted = false ORDER BY p.net_pay DESC LIMIT 10";
            }
            if (q.contains("lowest") || q.contains("minimum") || q.contains("least salary")) {
                return "SELECT e.employee_code, e.first_name, e.surname, e.designation, e.process_assigned, p.gross_salary, p.net_pay, p.wage_month, p.wage_year " +
                       "FROM payslips p JOIN employees e ON p.employee_id = e.id " +
                       "WHERE e.is_deleted = false AND p.net_pay > 0 ORDER BY p.net_pay ASC LIMIT 10";
            }
            if (q.contains("total") || q.contains("overall") || q.contains("sum") || q.contains("average") || q.contains("avg")) {
                return "SELECT p.wage_month, p.wage_year, COUNT(*) as total_employees, SUM(p.gross_salary) as total_gross, SUM(p.net_pay) as total_net_disbursed, AVG(p.net_pay) as avg_net_pay " +
                       "FROM payslips p JOIN employees e ON p.employee_id = e.id " +
                       "WHERE e.is_deleted = false GROUP BY p.wage_year, p.wage_month ORDER BY p.wage_year DESC, p.wage_month DESC LIMIT 12";
            }
            return "SELECT e.employee_code, e.first_name, e.surname, e.designation, p.wage_month, p.wage_year, p.gross_salary, p.net_pay, p.status " +
                   "FROM payslips p JOIN employees e ON p.employee_id = e.id " +
                   "WHERE e.is_deleted = false ORDER BY p.wage_year DESC, p.wage_month DESC, p.net_pay DESC LIMIT 25";
        }

        // ==========================================
        // D. HOLIDAYS
        // ==========================================

        if (q.contains("holiday") || q.contains("festive") || q.contains("festival") || q.contains("vacation")) {
            if (targetMonth != null) {
                return "SELECT name, holiday_date, year, is_optional, is_process_specific, processes " +
                       "FROM holidays WHERE year = " + targetYear + " AND EXTRACT(MONTH FROM holiday_date) = " + targetMonth + " " +
                       "ORDER BY holiday_date";
            }
            if (q.contains("upcoming") || q.contains("next")) {
                return "SELECT name, holiday_date, year, is_optional, is_process_specific, processes " +
                       "FROM holidays WHERE holiday_date >= CURRENT_DATE ORDER BY holiday_date LIMIT 15";
            }
            return "SELECT name, holiday_date, year, is_optional, is_process_specific, processes " +
                   "FROM holidays WHERE year = " + targetYear + " ORDER BY holiday_date";
        }

        // ==========================================
        // E. MASTER DATA & PROCESSES
        // ==========================================

        if (q.contains("process") || q.contains("processes") || q.contains("project")) {
            if (q.contains("list") || q.contains("all") || q.contains("what are") || q.contains("show")) {
                return "SELECT option_value as process_name, code, active FROM master_data WHERE category = 'PROCESS' AND active = true ORDER BY sort_order, option_value";
            }
            // Count per process
            return "SELECT COALESCE(process_assigned, 'Unassigned') as process_name, COUNT(*) as employee_count " +
                   "FROM employees WHERE is_deleted = false AND employee_status = 'LIVE' " +
                   "GROUP BY process_assigned ORDER BY employee_count DESC";
        }

        // Master data generic
        if (q.contains("master data") || q.contains("masterdata") || q.contains("category")) {
            return "SELECT category, code, option_value, active FROM master_data WHERE active = true ORDER BY category, sort_order LIMIT 50";
        }

        // ==========================================
        // F. PENDING REGISTRATIONS
        // ==========================================

        if (q.contains("registration") || q.contains("candidate") || q.contains("applicant") || q.contains("join request") || q.contains("onboarding")) {
            if (q.contains("pending")) {
                return "SELECT id, registration_code, first_name, surname, gender, mobile, email, designation, status, created_at " +
                       "FROM pending_registrations WHERE status = 'PENDING' ORDER BY created_at DESC LIMIT 30";
            }
            if (q.contains("approved")) {
                return "SELECT id, registration_code, first_name, surname, gender, mobile, email, designation, status, created_at " +
                       "FROM pending_registrations WHERE status = 'APPROVED' ORDER BY created_at DESC LIMIT 30";
            }
            if (q.contains("rejected")) {
                return "SELECT id, registration_code, first_name, surname, gender, mobile, email, designation, status, created_at " +
                       "FROM pending_registrations WHERE status = 'REJECTED' ORDER BY created_at DESC LIMIT 30";
            }
            return "SELECT id, registration_code, first_name, surname, gender, mobile, email, status, created_at " +
                   "FROM pending_registrations ORDER BY created_at DESC LIMIT 30";
        }

        // ==========================================
        // G. SPECIFIC EMPLOYEE LOOKUPS (BY CODE)
        // ==========================================

        if (empCode != null) {
            String codeUpper = empCode.toUpperCase();
            if (q.contains("dob") || q.contains("birth") || q.contains("born") || q.contains("age")) {
                return "SELECT employee_code, first_name, surname, dob, age, age_bracket, gender FROM employees WHERE UPPER(employee_code) = '" + codeUpper + "' AND is_deleted = false";
            }
            if (q.contains("contact") || q.contains("phone") || q.contains("mobile") || q.contains("call") || q.contains("email") || q.contains("mail")) {
                return "SELECT employee_code, first_name, surname, mobile, email, close_relative_name, close_relative_mobile FROM employees WHERE UPPER(employee_code) = '" + codeUpper + "' AND is_deleted = false";
            }
            if (q.contains("address") || q.contains("stay") || q.contains("live") || q.contains("location")) {
                return "SELECT employee_code, first_name, surname, present_address, permanent_address FROM employees WHERE UPPER(employee_code) = '" + codeUpper + "' AND is_deleted = false";
            }
            if (q.contains("bank") || q.contains("account") || q.contains("ifsc") || q.contains("branch")) {
                return "SELECT employee_code, first_name, surname, bank_name, account_number, ifsc_code, branch FROM employees WHERE UPPER(employee_code) = '" + codeUpper + "' AND is_deleted = false";
            }
            if (q.contains("aadhaar") || q.contains("aadhar") || q.contains("pan") || q.contains("kyc") || q.contains("identity") || q.contains("verification")) {
                return "SELECT employee_code, first_name, surname, aadhar_number, aadhaar_verification, pan_number, pan_verification, osv FROM employees WHERE UPPER(employee_code) = '" + codeUpper + "' AND is_deleted = false";
            }
            if (q.contains("pf") || q.contains("uan") || q.contains("esic") || q.contains("provident")) {
                return "SELECT employee_code, first_name, surname, uan_no, pf_no, uan_activation, esic_no, aadhar_seeding FROM employees WHERE UPPER(employee_code) = '" + codeUpper + "' AND is_deleted = false";
            }
            if (q.contains("education") || q.contains("qualification") || q.contains("study") || q.contains("degree")) {
                return "SELECT employee_code, first_name, surname, highest_qualification, level_of_education, year_of_passing, percentage_marks FROM employees WHERE UPPER(employee_code) = '" + codeUpper + "' AND is_deleted = false";
            }
            if (q.contains("family") || q.contains("father") || q.contains("mother") || q.contains("spouse") || q.contains("marital") || q.contains("relative")) {
                return "SELECT employee_code, first_name, surname, marital_status, father_name, father_phone, mother_name, mother_phone, spouse_name, spouse_phone, close_relative_name, close_relative_mobile FROM employees WHERE UPPER(employee_code) = '" + codeUpper + "' AND is_deleted = false";
            }
            if (q.contains("experience") || q.contains("past") || q.contains("previous") || q.contains("reference") || q.contains("ref")) {
                return "SELECT employee_code, first_name, surname, past_experience, organization_name, period_of_employment, ref1_name, ref1_mobile, ref2_name, ref2_mobile FROM employees WHERE UPPER(employee_code) = '" + codeUpper + "' AND is_deleted = false";
            }
            // Full comprehensive summary for this employee
            return "SELECT employee_code, first_name, surname, gender, designation, process_assigned, employee_status, doj, mobile, email, bank_name, account_number " +
                   "FROM employees WHERE UPPER(employee_code) = '" + codeUpper + "' AND is_deleted = false";
        }

        // ==========================================
        // H. EMPLOYEE DEMOGRAPHICS & AGGREGATIONS
        // ==========================================

        // Total / Count
        if (q.contains("total employee") || q.contains("how many employee") || q.contains("count of employee") || q.contains("number of employee") || q.contains("how many staff") || q.contains("total staff")) {
            return "SELECT COUNT(*) as total_employees, " +
                   "SUM(CASE WHEN employee_status = 'LIVE' THEN 1 ELSE 0 END) as active_employees, " +
                   "SUM(CASE WHEN employee_status != 'LIVE' THEN 1 ELSE 0 END) as exited_employees " +
                   "FROM employees WHERE is_deleted = false";
        }

        // Active / Live
        if (q.contains("active employee") || q.contains("live employee") || q.contains("working employee")) {
            return "SELECT employee_code, first_name, surname, gender, designation, process_assigned, doj, mobile " +
                   "FROM employees WHERE employee_status = 'LIVE' AND is_deleted = false ORDER BY first_name LIMIT 30";
        }

        // Exited / Resigned
        if (q.contains("exit") || q.contains("resigned") || q.contains("left") || q.contains("terminated")) {
            return "SELECT employee_code, first_name, surname, designation, process_assigned, doj, doe, exit_type, exit_reason " +
                   "FROM employees WHERE employee_status != 'LIVE' AND is_deleted = false ORDER BY doe DESC NULLS LAST LIMIT 30";
        }

        // Gender Distribution
        if (q.contains("gender") || q.contains("male") || q.contains("female") || q.contains("women") || q.contains("men")) {
            return "SELECT gender, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM employees WHERE is_deleted = false), 1) as percentage " +
                   "FROM employees WHERE is_deleted = false AND gender IS NOT NULL " +
                   "GROUP BY gender ORDER BY count DESC";
        }

        // Designation Distribution
        if (q.contains("designation") || q.contains("role") || q.contains("position") || q.contains("job title")) {
            return "SELECT designation, COUNT(*) as employee_count " +
                   "FROM employees WHERE is_deleted = false AND designation IS NOT NULL " +
                   "GROUP BY designation ORDER BY employee_count DESC LIMIT 20";
        }

        // Blood Group
        if (q.contains("blood") || q.contains("blood group")) {
            return "SELECT blood_group, COUNT(*) as count FROM employees WHERE is_deleted = false AND blood_group IS NOT NULL GROUP BY blood_group ORDER BY blood_group";
        }

        // Social Category / Caste / Religion
        if (q.contains("social category") || q.contains("caste") || q.contains("category") || q.contains("religion")) {
            if (q.contains("religion")) {
                return "SELECT religion, COUNT(*) as count FROM employees WHERE is_deleted = false AND religion IS NOT NULL GROUP BY religion ORDER BY count DESC";
            }
            return "SELECT social_category, social_subcategory, COUNT(*) as count FROM employees WHERE is_deleted = false AND social_category IS NOT NULL GROUP BY social_category, social_subcategory ORDER BY count DESC";
        }

        // Education / Qualification
        if (q.contains("education") || q.contains("qualification") || q.contains("degree") || q.contains("graduat")) {
            return "SELECT highest_qualification, COUNT(*) as count FROM employees WHERE is_deleted = false AND highest_qualification IS NOT NULL GROUP BY highest_qualification ORDER BY count DESC";
        }

        // Age / Age bracket
        if (q.contains("age bracket") || q.contains("age group") || q.contains("age distribution")) {
            return "SELECT age_bracket, COUNT(*) as count FROM employees WHERE is_deleted = false AND age_bracket IS NOT NULL GROUP BY age_bracket ORDER BY age_bracket";
        }

        // Recently Joined
        if (q.contains("recent") || q.contains("newly joined") || q.contains("new employee") || q.contains("latest join")) {
            return "SELECT employee_code, first_name, surname, designation, process_assigned, doj, mobile " +
                   "FROM employees WHERE is_deleted = false ORDER BY doj DESC NULLS LAST LIMIT 20";
        }

        // Name search fallback
        if (personName != null) {
            return "SELECT employee_code, first_name, surname, gender, designation, process_assigned, employee_status, mobile, email " +
                   "FROM employees WHERE is_deleted = false AND (LOWER(first_name) LIKE '%" + personName + "%' OR LOWER(surname) LIKE '%" + personName + "%') " +
                   "ORDER BY first_name LIMIT 10";
        }

        // Process search if query mentions one of the known processes
        for (String p : List.of("housing loan", "education loan", "business loan", "life insurance", "insurance", "vehicle loan", "sme", "hr")) {
            if (q.contains(p)) {
                return "SELECT employee_code, first_name, surname, designation, process_assigned, employee_status, mobile " +
                       "FROM employees WHERE is_deleted = false AND LOWER(process_assigned) LIKE '%" + p + "%' " +
                       "ORDER BY first_name LIMIT 30";
            }
        }

        // Catch-all list of employees
        if (q.contains("list employee") || q.contains("show employee") || q.contains("all employee") || q.contains("every employee") || q.contains("staff list")) {
            return "SELECT employee_code, first_name, surname, gender, designation, process_assigned, employee_status, mobile " +
                   "FROM employees WHERE is_deleted = false ORDER BY employee_code LIMIT 30";
        }

        return null;
    }

    // =========================================================================
    // SMART & NATURAL HUMAN-LIKE MARKDOWN FORMATTER
    // =========================================================================

    private String formatIntelligentResponse(String question, String sql, Text2SqlResponse.SqlResult result) {
        if (result.error != null) {
            log.error("Database query failed: {} with error: {}", sql, result.error);
            return "I ran into a small hiccup querying the database (`" + result.error + "`). Could you please check or rephrase your question?";
        }

        if (result.rows.isEmpty()) {
            return "I couldn't find any matching records in the database for your query. Let me know if you'd like to search with different details!";
        }

        String q = question.toLowerCase();

        // 1. Single scalar result (e.g. COUNT(*))
        if (result.columns.size() == 1 && result.rows.size() == 1) {
            Object val = result.rows.get(0).get(result.columns.get(0));
            String col = result.columns.get(0).toLowerCase();
            if (col.contains("count") || col.contains("total")) {
                return "The current total count is **" + val + "**.";
            }
            return "Here is what I found: **" + val + "**.";
        }

        // 2. Organization / Payroll Summary
        if (result.columns.contains("total_gross") || result.columns.contains("total_net_disbursed")) {
            StringBuilder sb = new StringBuilder();
            sb.append("Here is the **Payroll Summary & Disbursement**:\n\n");
            for (Map<String, Object> r : result.rows) {
                String my = r.containsKey("wage_month") ? (r.get("wage_month") + "/" + r.get("wage_year")) : "Latest Month";
                sb.append("💰 **Payroll Cycle: ").append(my).append("**\n");
                if (r.containsKey("total_employees")) sb.append("• 👥 **Processed Employees**: **").append(r.get("total_employees")).append(" staff members**\n");
                if (r.containsKey("total_gross")) sb.append("• 💵 **Total Gross Earnings**: ₹**").append(formatMoney(r.get("total_gross"))).append("**\n");
                if (r.containsKey("total_net_disbursed")) sb.append("• 💳 **Total Net Disbursed**: **₹").append(formatMoney(r.get("total_net_disbursed"))).append("**\n");
                if (r.containsKey("avg_net_pay")) sb.append("• 📈 **Average Take-Home Pay**: ₹**").append(formatMoney(r.get("avg_net_pay"))).append("**\n\n");
            }
            return sb.toString().trim();
        }

        // 3. Employee Workforce Overview (Total, Active, Exited)
        if (result.rows.size() == 1 && result.columns.contains("total_employees")) {
            Map<String, Object> r = result.rows.get(0);
            return "Here is the current **Workforce Overview** across the organization:\n\n" +
                   "• 👥 **Total Registered Workforce**: **" + r.getOrDefault("total_employees", 0) + " employees**\n" +
                   "• 🟢 **Actively Working (LIVE)**: **" + r.getOrDefault("active_employees", 0) + " employees**\n" +
                   "• ⚪ **Exited / Relieved**: **" + r.getOrDefault("exited_employees", 0) + " employees**";
        }

        // 4. Single Employee Comprehensive Profile
        if (result.rows.size() == 1 && result.columns.contains("employee_code")) {
            Map<String, Object> r = result.rows.get(0);
            String code = String.valueOf(r.getOrDefault("employee_code", ""));
            String firstName = String.valueOf(r.getOrDefault("first_name", ""));
            String surname = String.valueOf(r.getOrDefault("surname", ""));
            String fullName = (firstName + " " + surname).trim();
            if (fullName.isBlank() || fullName.equalsIgnoreCase("null null")) fullName = code;

            StringBuilder sb = new StringBuilder();
            sb.append("Here is the profile for **").append(fullName).append("** (`").append(code).append("`):\n\n");

            // Role & Status
            sb.append("📌 **Employment & Role**\n");
            if (r.containsKey("designation") && r.get("designation") != null) {
                sb.append("• **Designation**: `").append(r.get("designation")).append("`\n");
            }
            if (r.containsKey("process_assigned") && r.get("process_assigned") != null) {
                sb.append("• **Process**: `").append(r.get("process_assigned")).append("`\n");
            }
            if (r.containsKey("employee_status") && r.get("employee_status") != null) {
                String st = String.valueOf(r.get("employee_status"));
                String badge = st.equalsIgnoreCase("LIVE") ? "🟢 Active (LIVE)" : "⚪ " + st;
                sb.append("• **Status**: ").append(badge).append("\n");
            }
            if (r.containsKey("doj") && r.get("doj") != null) {
                sb.append("• **Joining Date**: `").append(r.get("doj")).append("`\n");
            }

            // Contact
            boolean hasContact = r.containsKey("mobile") || r.containsKey("email") || r.containsKey("present_address");
            if (hasContact) {
                sb.append("\n📞 **Contact Details**\n");
                if (r.containsKey("mobile") && r.get("mobile") != null) {
                    sb.append("• **Mobile**: `").append(r.get("mobile")).append("`\n");
                }
                if (r.containsKey("email") && r.get("email") != null && !r.get("email").toString().isBlank()) {
                    sb.append("• **Email**: `").append(r.get("email")).append("`\n");
                }
                if (r.containsKey("present_address") && r.get("present_address") != null && !r.get("present_address").toString().isBlank()) {
                    sb.append("• **Address**: ").append(r.get("present_address")).append("\n");
                }
            }

            // Bank Details
            if (r.containsKey("bank_name") && r.get("bank_name") != null && !r.get("bank_name").toString().isBlank()) {
                sb.append("\n🏦 **Banking & Salary Account**\n");
                sb.append("• **Bank**: `").append(r.get("bank_name")).append("`\n");
                if (r.containsKey("account_number") && r.get("account_number") != null) {
                    sb.append("• **Account No**: `").append(r.get("account_number")).append("`\n");
                }
                if (r.containsKey("ifsc_code") && r.get("ifsc_code") != null) {
                    sb.append("• **IFSC**: `").append(r.get("ifsc_code")).append("`\n");
                }
            }

            // Identity / Verification
            if (r.containsKey("aadhar_number") || r.containsKey("pan_number")) {
                sb.append("\n🪪 **Identity & Verification**\n");
                if (r.containsKey("aadhar_number") && r.get("aadhar_number") != null) {
                    sb.append("• **Aadhaar**: `").append(maskAadhaar(String.valueOf(r.get("aadhar_number")))).append("` (Status: `").append(r.getOrDefault("aadhaar_verification", "N/A")).append("`)\n");
                }
                if (r.containsKey("pan_number") && r.get("pan_number") != null) {
                    sb.append("• **PAN**: `").append(r.get("pan_number")).append("` (Status: `").append(r.getOrDefault("pan_verification", "N/A")).append("`)\n");
                }
            }

            // Salary details if present in single row
            if (r.containsKey("gross_salary") || r.containsKey("net_pay")) {
                sb.append("\n💵 **Latest Compensation**\n");
                if (r.containsKey("gross_salary")) sb.append("• **Gross Salary**: ₹`").append(r.get("gross_salary")).append("`\n");
                if (r.containsKey("total_deductions")) sb.append("• **Total Deductions**: ₹`").append(r.get("total_deductions")).append("`\n");
                if (r.containsKey("net_pay")) sb.append("• **Take-Home Net Pay**: **₹").append(r.get("net_pay")).append("**\n");
            }

            return sb.toString().trim();
        }

        // 5. Leave Balances Overview
        if (result.columns.contains("leave_type") && result.columns.contains("balance")) {
            StringBuilder sb = new StringBuilder();
            String firstEmpName = "";
            String firstEmpCode = "";
            if (!result.rows.isEmpty()) {
                Map<String, Object> r0 = result.rows.get(0);
                firstEmpName = (r0.getOrDefault("first_name", "") + " " + r0.getOrDefault("surname", "")).trim();
                firstEmpCode = String.valueOf(r0.getOrDefault("employee_code", ""));
            }

            if (!firstEmpName.isBlank() && result.rows.size() <= 6) {
                sb.append("Here is the leave availability for **").append(firstEmpName).append("** (`").append(firstEmpCode).append("`):\n\n");
            } else {
                sb.append("Here is the **Leave Balance Overview** (").append(result.rows.size()).append(" record(s)):\n\n");
            }

            for (Map<String, Object> r : result.rows) {
                String type = String.valueOf(r.getOrDefault("leave_type", "Leave"));
                String icon = getLeaveIcon(type);
                String bal = String.valueOf(r.getOrDefault("balance", "0"));
                String ent = String.valueOf(r.getOrDefault("entitled", "0"));
                String taken = String.valueOf(r.getOrDefault("taken", "0"));
                String emp = r.containsKey("first_name") && result.rows.size() > 6 ? (r.get("first_name") + " (" + r.get("employee_code") + ") — ") : "";

                sb.append(icon).append(" **").append(emp).append(type).append("**: **").append(bal).append(" available** ")
                  .append("(Entitled: `").append(ent).append("`, Taken: `").append(taken).append("`)\n");
            }
            return sb.toString().trim();
        }

        // 6. Comp-Off Records (COG / COT)
        if (q.contains("cog") || q.contains("cot") || result.columns.contains("earned_date")) {
            StringBuilder sb = new StringBuilder();
            boolean isCog = q.contains("cog") || q.contains("earned") || q.contains("given");
            boolean isCot = q.contains("cot") || q.contains("taken") || q.contains("availed");

            if (isCog) {
                sb.append("Here are the team members who recently **earned Comp-Off credit (`COG`)**:\n\n");
            } else if (isCot) {
                sb.append("Here are the team members who recently **availed Comp-Off leave (`COT`)**:\n\n");
            } else {
                sb.append("Here are the **Comp-Off Records**:\n\n");
            }

            int idx = 1;
            for (Map<String, Object> r : result.rows) {
                String emp = (r.getOrDefault("first_name", "") + " " + r.getOrDefault("surname", "")).trim();
                String code = String.valueOf(r.getOrDefault("employee_code", ""));
                String proc = String.valueOf(r.getOrDefault("process_assigned", ""));
                String dt = String.valueOf(r.containsKey("attendance_date") ? r.get("attendance_date") : r.getOrDefault("earned_date", "-"));
                String st = String.valueOf(r.getOrDefault("status", ""));

                sb.append(idx++).append(". **").append(emp.isBlank() ? code : emp).append("** (`").append(code).append("`)");
                if (!proc.isBlank() && !proc.equalsIgnoreCase("null") && !proc.equalsIgnoreCase("-")) {
                    sb.append(" — *").append(proc).append("*");
                }
                sb.append("\n   • **Date**: `").append(dt).append("` | **Status**: `").append(st).append("`\n");
            }
            return sb.toString().trim();
        }

        // 7. Attendance Records (Absent / Present / Log)
        if (result.columns.contains("attendance_date") && result.columns.contains("status")) {
            StringBuilder sb = new StringBuilder();
            boolean isAbsent = q.contains("absent") || q.contains("not present");
            boolean isPresent = q.contains("present") && !q.contains("absent");

            if (isAbsent) {
                sb.append("Here are the team members marked **Absent (A)** (").append(result.rows.size()).append(" employee(s)):\n\n");
            } else if (isPresent) {
                sb.append("Here are the team members marked **Present (P)** (").append(result.rows.size()).append(" employee(s)):\n\n");
            } else {
                sb.append("Here are the **Attendance Records** (").append(result.rows.size()).append("):\n\n");
            }

            int idx = 1;
            for (Map<String, Object> r : result.rows) {
                String emp = (r.getOrDefault("first_name", "") + " " + r.getOrDefault("surname", "")).trim();
                String code = String.valueOf(r.getOrDefault("employee_code", ""));
                String proc = String.valueOf(r.getOrDefault("process_assigned", ""));
                String desig = String.valueOf(r.getOrDefault("designation", ""));
                String dt = String.valueOf(r.getOrDefault("attendance_date", ""));
                String st = String.valueOf(r.getOrDefault("status", ""));
                String mob = String.valueOf(r.getOrDefault("mobile", ""));

                sb.append(idx++).append(". **").append(emp.isBlank() ? code : emp).append("** (`").append(code).append("`)");
                if (!desig.isBlank() && !desig.equalsIgnoreCase("null")) {
                    sb.append(" — *").append(desig).append("*");
                }
                if (!proc.isBlank() && !proc.equalsIgnoreCase("null")) {
                    sb.append(" [").append(proc).append("]");
                }
                sb.append("\n   • **Date**: `").append(dt).append("` | **Status**: `").append(st).append("`");
                if (!mob.isBlank() && !mob.equalsIgnoreCase("null")) {
                    sb.append(" | 📞 `").append(mob).append("`");
                }
                sb.append("\n");
            }
            return sb.toString().trim();
        }

        // 8. Holidays Calendar
        if (result.columns.contains("holiday_date")) {
            StringBuilder sb = new StringBuilder();
            sb.append("Here are the **Holidays** in the system calendar:\n\n");
            for (Map<String, Object> r : result.rows) {
                String name = String.valueOf(r.getOrDefault("name", ""));
                String dt = String.valueOf(r.getOrDefault("holiday_date", ""));
                boolean opt = Boolean.TRUE.equals(r.get("is_optional"));
                String proc = Boolean.TRUE.equals(r.get("is_process_specific")) ? String.valueOf(r.getOrDefault("processes", "All")) : "All Processes";

                sb.append("🎉 **").append(name).append("**\n")
                  .append("• **Date**: `").append(dt).append("` (").append(opt ? "Optional" : "Mandatory").append(")\n")
                  .append("• **Applicable Processes**: *").append(proc).append("*\n\n");
            }
            return sb.toString().trim();
        }

        // 9. Payslips Table
        if (result.columns.contains("gross_salary") || result.columns.contains("net_pay")) {
            StringBuilder sb = new StringBuilder();
            sb.append("Here are the **Payroll & Salary Records**:\n\n");
            for (Map<String, Object> r : result.rows) {
                String emp = (r.getOrDefault("first_name", "") + " " + r.getOrDefault("surname", "")).trim();
                String code = String.valueOf(r.getOrDefault("employee_code", ""));
                String my = r.getOrDefault("wage_month", "") + "/" + r.getOrDefault("wage_year", "");
                sb.append("💵 **").append(emp.isBlank() ? code : emp).append("** (`").append(code).append("`) — *").append(my).append("*\n")
                  .append("• **Gross Salary**: ₹`").append(r.getOrDefault("gross_salary", "0")).append("`\n")
                  .append("• **Deductions**: ₹`").append(r.getOrDefault("total_deductions", "0")).append("`\n")
                  .append("• **Take-Home Net Pay**: **₹").append(r.getOrDefault("net_pay", "0")).append("**\n\n");
            }
            return sb.toString().trim();
        }

        // 10. Master Processes List
        if (result.columns.contains("process_name")) {
            StringBuilder sb = new StringBuilder();
            sb.append("Here are the **Master Processes** configured in the system:\n\n");
            int idx = 1;
            for (Map<String, Object> r : result.rows) {
                String pName = String.valueOf(r.getOrDefault("process_name", ""));
                String code = String.valueOf(r.getOrDefault("code", ""));
                sb.append(idx++).append(". 🏢 **").append(pName).append("** (`").append(code).append("`)\n");
            }
            return sb.toString().trim();
        }

        // 11. Aggregation Breakdown (Processes, Gender, Designation)
        if (result.columns.stream().anyMatch(c -> c.toLowerCase().contains("count") || c.toLowerCase().contains("total"))) {
            StringBuilder sb = new StringBuilder();
            sb.append("Here is the **Distribution Breakdown**:\n\n");
            for (Map<String, Object> r : result.rows) {
                String label = r.entrySet().stream()
                    .filter(e -> !e.getKey().toLowerCase().contains("count") && !e.getKey().toLowerCase().contains("total") && !e.getKey().toLowerCase().contains("percentage"))
                    .map(e -> e.getValue() == null || e.getValue().toString().isBlank() ? "Unassigned" : e.getValue().toString())
                    .collect(Collectors.joining(" - "));
                Object count = r.entrySet().stream()
                    .filter(e -> e.getKey().toLowerCase().contains("count") || e.getKey().toLowerCase().contains("total"))
                    .map(Map.Entry::getValue)
                    .findFirst().orElse("0");
                sb.append("• 🏢 **").append(label.isBlank() ? "Total" : label).append("**: **").append(count).append(" employees**");
                if (r.containsKey("percentage")) {
                    sb.append(" (*").append(r.get("percentage")).append("%*)");
                }
                sb.append("\n");
            }
            return sb.toString().trim();
        }

        // 11. General Employee List (up to 30 rows)
        if (result.columns.contains("employee_code")) {
            StringBuilder sb = new StringBuilder();
            sb.append("I found **").append(result.rows.size()).append(" employee(s)**:\n\n");
            int idx = 1;
            for (Map<String, Object> r : result.rows) {
                String code = String.valueOf(r.getOrDefault("employee_code", ""));
                String name = (r.getOrDefault("first_name", "") + " " + r.getOrDefault("surname", "")).trim();
                sb.append(idx++).append(". **").append(name.isBlank() ? code : name).append("** (`").append(code).append("`)");
                if (r.containsKey("designation") && r.get("designation") != null && !r.get("designation").toString().isBlank()) {
                    sb.append(" — *").append(r.get("designation")).append("*");
                }
                if (r.containsKey("process_assigned") && r.get("process_assigned") != null && !r.get("process_assigned").toString().isBlank()) {
                    sb.append(" [").append(r.get("process_assigned")).append("]");
                }
                if (r.containsKey("mobile") && r.get("mobile") != null && !r.get("mobile").toString().isBlank()) {
                    sb.append(" 📞 `").append(r.get("mobile")).append("`");
                }
                sb.append("\n");
            }
            return sb.toString().trim();
        }

        return "I found **" + result.rows.size() + "** result(s) for your inquiry.";
    }

    private String getLeaveIcon(String type) {
        if (type == null) return "🏖️";
        String t = type.toUpperCase();
        if (t.contains("CL") || t.contains("CASUAL")) return "🏖️";
        if (t.contains("PL") || t.contains("PAID") || t.contains("PRIVILEGE")) return "🌴";
        if (t.contains("SL") || t.contains("SICK")) return "🤒";
        if (t.contains("CO") || t.contains("COMP")) return "⏱️";
        return "📅";
    }

    private String formatMoney(Object amount) {
        if (amount == null) return "0";
        try {
            double val = Double.parseDouble(String.valueOf(amount));
            return String.format("%,.2f", val);
        } catch (Exception e) {
            return String.valueOf(amount);
        }
    }

    private String maskAadhaar(String aadhaar) {
        if (aadhaar == null || aadhaar.length() < 8) return aadhaar != null ? aadhaar : "";
        String clean = aadhaar.replaceAll("\\s+", "");
        if (clean.length() >= 8) {
            return "XXXX-XXXX-" + clean.substring(clean.length() - 4);
        }
        return aadhaar;
    }

    // =========================================================================
    // ENTITY EXTRACTION HELPERS
    // =========================================================================

    private String extractEmployeeCode(String question) {
        Matcher matcher = EMP_CODE_PATTERN.matcher(question);
        if (matcher.find()) {
            String match = matcher.group(1);
            // Ignore common false positives
            if (!List.of("today", "total", "year2024", "year2025", "year2026").contains(match.toLowerCase())) {
                return match;
            }
        }
        return null;
    }

    private String extractName(String question) {
        String q = question.toLowerCase().trim();
        String[] patterns = {
            "(?:who is|about|tell me about|show|find|for|of)\\s+([a-zA-Z]{3,20})(?:'s|s)?",
            "([a-zA-Z]{3,20})(?:'s|s)?\\s+(?:salary|leave|attendance|details|profile|record|balance|payslip)"
        };
        for (String pat : patterns) {
            Matcher m = Pattern.compile(pat, Pattern.CASE_INSENSITIVE).matcher(q);
            if (m.find()) {
                String candidate = m.group(1).toLowerCase();
                List<String> stopWords = List.of(
                    "the", "all", "any", "how", "what", "who", "when", "where", "which",
                    "many", "much", "total", "count", "active", "live", "exit", "cog", "cot",
                    "comp", "leave", "attendance", "salary", "holiday", "process", "pending", "approved"
                );
                if (!stopWords.contains(candidate)) {
                    return candidate;
                }
            }
        }
        return null;
    }

    private LocalDate extractDate(String question) {
        String q = question.toLowerCase();
        if (q.contains("today")) return LocalDate.now();
        if (q.contains("yesterday")) return LocalDate.now().minusDays(1);

        // Pattern YYYY-MM-DD
        Matcher m1 = Pattern.compile("\\b(\\d{4})-(\\d{1,2})-(\\d{1,2})\\b").matcher(question);
        if (m1.find()) {
            try {
                return LocalDate.parse(m1.group());
            } catch (Exception ignored) {}
        }

        // Pattern DD-MM-YYYY
        Matcher m2 = Pattern.compile("\\b(\\d{1,2})-(\\d{1,2})-(\\d{4})\\b").matcher(question);
        if (m2.find()) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d-M-yyyy");
                return LocalDate.parse(m2.group(), formatter);
            } catch (Exception ignored) {}
        }

        return null;
    }

    private Integer extractMonth(String question) {
        String q = question.toLowerCase();
        Map<String, Integer> months = Map.ofEntries(
            Map.entry("january", 1), Map.entry("jan", 1),
            Map.entry("february", 2), Map.entry("feb", 2),
            Map.entry("march", 3), Map.entry("mar", 3),
            Map.entry("april", 4), Map.entry("apr", 4),
            Map.entry("may", 5),
            Map.entry("june", 6), Map.entry("jun", 6),
            Map.entry("july", 7), Map.entry("jul", 7),
            Map.entry("august", 8), Map.entry("aug", 8),
            Map.entry("september", 9), Map.entry("sep", 9), Map.entry("sept", 9),
            Map.entry("october", 10), Map.entry("oct", 10),
            Map.entry("november", 11), Map.entry("nov", 11),
            Map.entry("december", 12), Map.entry("dec", 12)
        );
        for (var entry : months.entrySet()) {
            if (Pattern.compile("\\b" + entry.getKey() + "\\b").matcher(q).find()) {
                return entry.getValue();
            }
        }
        return null;
    }

    private Integer extractYear(String question) {
        Matcher m = Pattern.compile("\\b(202[0-9]|203[0-9])\\b").matcher(question);
        if (m.find()) {
            return Integer.parseInt(m.group(1));
        }
        return null;
    }

    // =========================================================================
    // SQL EXECUTION
    // =========================================================================

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

    private String formatColumnLabel(String col) {
        return Arrays.stream(col.split("_"))
            .map(w -> w.isEmpty() ? "" : Character.toUpperCase(w.charAt(0)) + (w.length() > 1 ? w.substring(1) : ""))
            .collect(Collectors.joining(" "));
    }

    // =========================================================================
    // GREETINGS & HELP RESPONSES
    // =========================================================================

    private boolean isGreeting(String q) {
        return GREETINGS.stream().anyMatch(g -> q.equals(g) || q.startsWith(g + " ") || q.endsWith(" " + g));
    }

    private String getGreetingResponse(String q) {
        if (q.contains("thank") || q.contains("thanks")) {
            return "😊 You're very welcome! Let me know if you need anything else from the Employee Management System.";
        }
        if (q.contains("how are you")) {
            return "👋 I'm doing great, thank you! I'm your EMS AI Assistant. How can I help you today with employee, attendance, leave, or payroll data?";
        }
        if (q.contains("good morning")) {
            return "🌅 Good morning! How can I assist you today with the EMS database?";
        }
        if (q.contains("good afternoon")) {
            return "☀️ Good afternoon! Ready to answer any questions about employees, leaves, attendance, or salaries.";
        }
        if (q.contains("good evening")) {
            return "🌆 Good evening! How can I help you wrap up your HR tasks today?";
        }
        return "👋 Hello! I am your **EMS Offline AI Assistant**. I can query real-time database records for you with zero external dependencies. Ask me anything!";
    }

    private String getHelpResponse() {
        return "🤖 **What I Can Do For You (100% Offline & Local Engine):**\n\n" +
               "1. 📅 **Attendance & Comp-Offs**\n" +
               "   - *'Who is absent today?'*\n" +
               "   - *'Who earned comp off COG?'* or *'Who took comp off COT?'*\n" +
               "   - *'Attendance of PARI0002'*\n\n" +
               "2. 🏖️ **Leave Management**\n" +
               "   - *'Leave balance of PARI0001'*\n" +
               "   - *'Pending leave applications'*\n" +
               "   - *'CL balance for all employees'*\n\n" +
               "3. 💵 **Salaries & Payroll**\n" +
               "   - *'Salary of Ramesh'*\n" +
               "   - *'Payslip of PARI0005'*\n" +
               "   - *'Total payroll cost for August'*\n\n" +
               "4. 👥 **Employees & Demographics**\n" +
               "   - *'Total active employees'*\n" +
               "   - *'Employees in Housing Loan process'*\n" +
               "   - *'Gender distribution / Blood group count'*\n\n" +
               "5. 🎉 **Holidays & Registrations**\n" +
               "   - *'Upcoming holidays'* / *'Holidays in September'*\n" +
               "   - *'Pending candidate registrations'*\n\n" +
               "Just type your question naturally!";
    }

    private String getPolicyExplanation(String q) {
        // Comp-off explanation (COG vs COT)
        if ((q.contains("cog") || q.contains("cot") || q.contains("comp off") || q.contains("compoff")) 
            && (q.contains("how") || q.contains("what is") || q.contains("mean") || q.contains("rule") || q.contains("work") || q.contains("explain"))) {
            return "⏱️ **How Comp-Offs (`COG` & `COT`) Work in EMS:**\n\n" +
                   "• **`COG` (Comp-Off Given / Earned)**:\n" +
                   "  When an employee works on a Holiday or Week-Off, updating attendance status to `COG` automatically **adds +1 Comp-Off** to their leave balance (`CO`) and logs the earned date in the Comp-Off Ledger.\n\n" +
                   "• **`COT` (Comp-Off Taken / Availed)**:\n" +
                   "  When the employee avails their comp-off leave, updating attendance to `COT` (or approving their `CO` leave application) deducts 1 day from their comp-off balance and marks the earliest available credit as **AVAILED** with the availed date.\n\n" +
                   "• **Applying for Comp-Off**:\n" +
                   "  Employees can choose `CO` in **Leave Application** to consume their earned comp-off credit.";
        }

        // Attendance Locking & Freezing policy
        if ((q.contains("freeze") || q.contains("lock") || q.contains("past month") || q.contains("last month") || q.contains("sunday") || q.contains("weekoff") || q.contains("week off"))
            && (q.contains("how") || q.contains("why") || q.contains("rule") || q.contains("work") || q.contains("explain") || q.contains("policy"))) {
            return "📅 **EMS Attendance & Freezing Policy:**\n\n" +
                   "• **Monthly Calendar Range**: 1st to 30th/31st of every month.\n" +
                   "• **Past Month Freezing**: Previous months are automatically locked to prevent unintended retro-modifications and protect payroll integrity.\n" +
                   "• **Sunday Week-Offs**: Sundays are no longer hardcoded as default holidays. HR has full control to mark Sundays or specific days as Week-Off (`WO`) or Holiday (`H`) using the **'Mark Day for All'** action.";
        }

        // Holiday allocation by Process
        if ((q.contains("holiday") || q.contains("process")) && (q.contains("how") || q.contains("allocate") || q.contains("assign") || q.contains("specific") || q.contains("checkbox"))) {
            if (q.contains("holiday")) {
                return "🎉 **Holiday Allocation by Process:**\n\n" +
                       "• When creating or editing a holiday in **Masters > Holiday List**, HR can check **Process Specific Allocation**.\n" +
                       "• Select specific processes (*e.g. Housing Loan, Education Loan, HR*) to apply the holiday exclusively to those teams.\n" +
                       "• Leaving the checkbox unchecked applies the holiday to **all employees** across the organization.";
            }
        }

        // Master Processes in EMS
        if (q.contains("what process") || q.contains("list process") || q.contains("which process") || q.contains("all process")) {
            return "🏢 **Official Master Processes in EMS:**\n\n" +
                   "1. **Housing Loan**\n" +
                   "2. **Education Loan**\n" +
                   "3. **Business Loan**\n" +
                   "4. **Insurance**\n" +
                   "5. **Life Insurance**\n" +
                   "6. **SME / Vehicle Loan**\n" +
                   "7. **HR (Human Resources)**\n\n" +
                   "These processes are unified across Employee Onboarding, Attendance filters, and Process-wise Holiday allocations.";
        }

        // Draggable Chatbot Icon
        if (q.contains("drag") || q.contains("move") || (q.contains("chat") && q.contains("icon"))) {
            return "🤖 **Floating Assistant Navigation:**\n\n" +
                   "You can click and drag the chatbot floating icon anywhere on your screen. It automatically clamps to screen boundaries and saves your preferred position in your browser!";
        }

        return null;
    }

    private Text2SqlResponse processWithLlm(String question) {
        String llmResponse = callLlm(question);
        String sql = extractSqlFromConversation(llmResponse);

        if (sql == null) {
            return Text2SqlResponse.builder()
                .success(true)
                .question(question)
                .message(llmResponse.trim())
                .build();
        }

        if (!SELECT_ONLY.matcher(sql).matches() || BLOCKED_KEYWORDS.matcher(sql).find()) {
            log.warn("Blocked unsafe query: {}", sql);
            return Text2SqlResponse.builder()
                .success(true)
                .question(question)
                .message("I can only execute safe read-only queries.")
                .build();
        }

        Text2SqlResponse.SqlResult result = executeQuery(sql);
        String message = formatIntelligentResponse(question, sql, result);

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

    private String callLlm(String question) {
        String prompt = "You are an HR database assistant. Generate a PostgreSQL SELECT query for: " + question;
        if (geminiApiKey != null && !geminiApiKey.isEmpty()) {
            return callGemini(prompt);
        }
        return callOpenAi(prompt);
    }

    private String callGemini(String prompt) {
        Map<String, Object> contentPart = Map.of("text", prompt);
        Map<String, Object> requestBody = Map.of(
            "contents", List.of(Map.of("parts", List.of(contentPart))),
            "generationConfig", Map.of("temperature", 0.2, "maxOutputTokens", 500)
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<JsonNode> response = restTemplate.postForEntity(
            "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey,
            entity, JsonNode.class);

        if (response.getBody() == null) throw new RuntimeException("Empty response from Gemini");

        return response.getBody()
            .path("candidates").get(0)
            .path("content").path("parts").get(0)
            .path("text").asText();
    }

    private String callOpenAi(String prompt) {
        Map<String, Object> requestBody = Map.of(
            "model", openAiModel,
            "messages", List.of(Map.of("role", "user", "content", prompt)),
            "temperature", 0.2,
            "max_tokens", 500
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openAiApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<JsonNode> response = restTemplate.postForEntity(
            "https://api.openai.com/v1/chat/completions", entity, JsonNode.class);

        if (response.getBody() == null) throw new RuntimeException("Empty response from OpenAI");

        return response.getBody()
            .path("choices").get(0)
            .path("message").path("content").asText();
    }

    private String extractSqlFromConversation(String text) {
        if (text == null) return null;
        var sqlMatcher = SQL_BLOCK.matcher(text);
        if (sqlMatcher.find()) {
            String sql = sqlMatcher.group(1).trim().replaceAll("```[a-zA-Z]*\\s*", "").replaceAll("```", "");
            int semiIdx = sql.indexOf(';');
            return semiIdx >= 0 ? sql.substring(0, semiIdx).trim() : sql.trim();
        }
        int selectIdx = text.toUpperCase().indexOf("SELECT");
        if (selectIdx >= 0) {
            String sql = text.substring(selectIdx).trim().replaceAll("```[a-zA-Z]*\\s*", "").replaceAll("```", "");
            int semiIdx = sql.indexOf(';');
            return semiIdx >= 0 ? sql.substring(0, semiIdx).trim() : sql.trim();
        }
        return null;
    }
}
