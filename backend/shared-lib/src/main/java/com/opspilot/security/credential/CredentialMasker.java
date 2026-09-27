package com.opspilot.security.credential;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CredentialMasker {

    // Common patterns for secrets/tokens in logs or JSON
    private static final Pattern SECRET_PATTERN = Pattern.compile("(?i)([a-z0-9_.-]*(?:password|secret|token|access[_-]?key|api[_-]?key|oauth)[a-z0-9_.-]*)[=:\"'\\s]+([^&,\\s}\"']+)");
    private static final String MASK = "********";

    /**
     * Masks sensitive information such as passwords, tokens, and access keys in a given string.
     * @param input The raw input string
     * @return The masked string
     */
    public static String mask(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }

        Matcher matcher = SECRET_PATTERN.matcher(input);
        StringBuilder result = new StringBuilder();
        
        while (matcher.find()) {
            // Group 1 is the key, Group 2 is the secret value.
            // Replace the secret value with MASK.
            matcher.appendReplacement(result, matcher.group().replace(matcher.group(2), MASK));
        }
        matcher.appendTail(result);

        return result.toString();
    }
}
