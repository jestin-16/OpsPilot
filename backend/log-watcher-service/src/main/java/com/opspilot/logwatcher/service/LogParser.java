package com.opspilot.logwatcher.service;

import com.opspilot.logwatcher.model.ParsedLogLine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class LogParser {

    private final boolean maskingEnabled;
    private final List<Pattern> maskingPatterns = new ArrayList<>();

    // Kubernetes RFC3339 timestamp pattern at the beginning of the line
    private static final Pattern K8S_TIMESTAMP_PATTERN = Pattern.compile(
            "^(\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2}))\\s+(.*)$"
    );

    // Level detection heuristics
    private static final Pattern ERROR_PATTERN = Pattern.compile(
            "(?i)(\\b(ERROR|FATAL|SEVERE|CRITICAL|FAIL|FAILED|FAILURE|EXCEPTION|Traceback|Panic|5\\d{2}\\s+Internal)\\b|\\w+Error:|\\w+Exception:|[a-zA-Z0-9_]*(Error|Exception)\\b)"
    );

    private static final Pattern WARN_PATTERN = Pattern.compile(
            "\\b(WARN|WARNING)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern DEBUG_PATTERN = Pattern.compile(
            "\\b(DEBUG)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern TRACE_PATTERN = Pattern.compile(
            "\\b(TRACE)\\b",
            Pattern.CASE_INSENSITIVE
    );

    public LogParser(@Value("${log-watcher.masking-enabled:true}") boolean maskingEnabled) {
        this.maskingEnabled = maskingEnabled;
        initMaskingPatterns();
    }

    private void initMaskingPatterns() {
        // Regex patterns for sensitive credentials, tokens, and passwords
        maskingPatterns.add(Pattern.compile("(?i)(password|passwd|pwd|secret|api_key|apikey|access_token|refresh_token|private_key)\\s*[:=]\\s*[\"']?([^\\s,\"'>]+)"));
        maskingPatterns.add(Pattern.compile("(?i)(bearer\\s+)[a-zA-Z0-9_\\-\\.~+/]+=*"));
        maskingPatterns.add(Pattern.compile("(?i)(authorization\\s*:\\s*)[^\\r\\n]+"));
    }

    /**
     * Parses a raw line from Kubernetes pod log stream.
     */
    public ParsedLogLine parse(String rawLine, String namespace, String pod, String container) {
        if (rawLine == null) {
            rawLine = "";
        }

        String message = rawLine;
        String timestampStr = null;
        Instant parsedTimestamp = null;

        Matcher k8sMatcher = K8S_TIMESTAMP_PATTERN.matcher(rawLine);
        if (k8sMatcher.matches()) {
            timestampStr = k8sMatcher.group(1);
            message = k8sMatcher.group(2);
            try {
                parsedTimestamp = Instant.parse(timestampStr);
            } catch (DateTimeParseException e) {
                // Keep string timestamp, fallback parsedTimestamp to now
                parsedTimestamp = Instant.now();
            }
        } else {
            parsedTimestamp = Instant.now();
            timestampStr = DateTimeFormatter.ISO_INSTANT.format(parsedTimestamp);
        }

        if (maskingEnabled) {
            message = maskSensitiveData(message);
        }

        String level = detectLevel(message);

        return new ParsedLogLine(
                timestampStr,
                parsedTimestamp,
                namespace,
                pod,
                container,
                level,
                message,
                rawLine
        );
    }

    public String maskSensitiveData(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }

        String result = input;
        for (Pattern pattern : maskingPatterns) {
            Matcher matcher = pattern.matcher(result);
            if (matcher.find()) {
                // If it's key=value pattern, preserve key name and mask value
                if (matcher.groupCount() >= 2) {
                    result = matcher.replaceAll("$1=***REDACTED***");
                } else if (matcher.groupCount() == 1) {
                    result = matcher.replaceAll("$1***REDACTED***");
                } else {
                    result = matcher.replaceAll("***REDACTED***");
                }
            }
        }
        return result;
    }

    public String detectLevel(String text) {
        if (text == null) {
            return "INFO";
        }
        if (ERROR_PATTERN.matcher(text).find()) {
            return "ERROR";
        }
        if (WARN_PATTERN.matcher(text).find()) {
            return "WARN";
        }
        if (DEBUG_PATTERN.matcher(text).find()) {
            return "DEBUG";
        }
        if (TRACE_PATTERN.matcher(text).find()) {
            return "TRACE";
        }
        return "INFO";
    }

    public boolean isMaskingEnabled() {
        return maskingEnabled;
    }
}
