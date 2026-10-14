package com.opspilot.connector;

import java.util.Locale;
import java.util.regex.Pattern;

/** Normalizes the many spellings of a log level to DEBUG / INFO / WARN / ERROR. */
public final class Levels {

    private static final Pattern ERROR = Pattern.compile("\\b(ERROR|ERR|FATAL|CRITICAL|SEVERE|PANIC|EXCEPTION)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern WARN = Pattern.compile("\\b(WARN|WARNING)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern DEBUG = Pattern.compile("\\b(DEBUG|TRACE)\\b", Pattern.CASE_INSENSITIVE);

    private Levels() {
    }

    public static String normalize(String level) {
        if (level == null || level.isBlank()) {
            return "INFO";
        }
        switch (level.trim().toUpperCase(Locale.ROOT)) {
            case "ERROR": case "ERR": case "FATAL": case "CRITICAL": case "SEVERE": case "PANIC":
                return "ERROR";
            case "WARN": case "WARNING":
                return "WARN";
            case "DEBUG": case "TRACE":
                return "DEBUG";
            default:
                return "INFO";
        }
    }

    /** Best-effort level from free text (container / pod / console output). */
    public static String detect(String message) {
        if (message == null) {
            return "INFO";
        }
        if (ERROR.matcher(message).find()) return "ERROR";
        if (WARN.matcher(message).find()) return "WARN";
        if (DEBUG.matcher(message).find()) return "DEBUG";
        return "INFO";
    }
}
