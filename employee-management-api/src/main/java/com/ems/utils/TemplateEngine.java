package com.ems.utils;

import com.ems.model.Company;
import com.ems.model.Employee;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility that processes document template content by replacing
 * {{placeholders}} with actual employee and company data.
 */
public final class TemplateEngine {

    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{\\s*(\\w+)\\s*}}");

    private TemplateEngine() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * Processes the template content by replacing all {{placeholders}}
     * with resolved values from the given employee and company data.
     *
     * @param templateContent the raw template HTML with {{placeholders}}
     * @param employee        the employee entity
     * @param company         the company entity (singleton)
     * @return filled HTML content
     */
    public static String process(String templateContent, Employee employee, Company company) {
        if (templateContent == null || templateContent.isEmpty()) {
            return "";
        }

        Map<String, String> values = TemplatePlaceholderResolver.resolve(employee, company);

        StringBuilder result = new StringBuilder();
        Matcher matcher = PLACEHOLDER_PATTERN.matcher(templateContent);
        int lastEnd = 0;

        while (matcher.find()) {
            // Append text before the placeholder
            result.append(templateContent, lastEnd, matcher.start());

            // Get the placeholder name and its resolved value
            String placeholder = matcher.group(1).trim().toLowerCase();
            String replacement = values.getOrDefault(placeholder, "{{" + matcher.group(1) + "}}");

            result.append(replacement);
            lastEnd = matcher.end();
        }

        // Append remaining text after last placeholder
        result.append(templateContent.substring(lastEnd));

        return result.toString();
    }

    /**
     * Processes the template with a pre-built values map.
     */
    public static String processWithMap(String templateContent, Map<String, String> values) {
        if (templateContent == null || templateContent.isEmpty()) {
            return "";
        }

        StringBuilder result = new StringBuilder();
        Matcher matcher = PLACEHOLDER_PATTERN.matcher(templateContent);
        int lastEnd = 0;

        while (matcher.find()) {
            result.append(templateContent, lastEnd, matcher.start());
            String placeholder = matcher.group(1).trim().toLowerCase();
            String replacement = values.getOrDefault(placeholder, "{{" + matcher.group(1) + "}}");
            result.append(replacement);
            lastEnd = matcher.end();
        }

        result.append(templateContent.substring(lastEnd));
        return result.toString();
    }
}
