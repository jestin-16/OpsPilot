package com.opspilot.logstore;

import java.util.Collection;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Builds LogQL from validated parts. Clients never supply LogQL; every value is either checked against a strict
 * pattern or escaped, and the project/source matchers are always present and come from the caller's accessible sources.
 */
public final class LogQlBuilder {

    public static final Pattern ENVIRONMENT = Pattern.compile("^[a-z0-9][a-z0-9_-]{0,31}$");
    public static final Pattern CONTAINER = Pattern.compile("^[A-Za-z0-9_.-]{1,128}$");
    public static final int MAX_TEXT_LENGTH = 200;

    // Shared with level detection so filtering and displayed levels agree. Valid in both Java and RE2.
    public static final String ERROR_RE = "(?i)(\\b(error|fatal|panic|critical)\\b|exception)";
    public static final String WARN_RE = "(?i)\\b(warn|warning)\\b";
    public static final String DEBUG_RE = "(?i)\\b(debug|trace)\\b";

    public enum Level {
        ERROR, WARN, INFO, DEBUG;

        public static Level parse(String s) {
            if (s == null || s.isBlank() || s.equalsIgnoreCase("ALL")) return null;
            try {
                return valueOf(s.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Level must be one of ERROR, WARN, INFO, DEBUG");
            }
        }
    }

    /** Caller-authorised scope plus optional narrowing filters. Scope sets must be non-empty. */
    public record Filter(Collection<Long> projectIds, Collection<UUID> sourceIds, String environment,
                         String container, Level level, String text) {
    }

    private LogQlBuilder() {
    }

    public static String build(Filter f) {
        if (f.projectIds() == null || f.projectIds().isEmpty() || f.sourceIds() == null || f.sourceIds().isEmpty()) {
            throw new IllegalArgumentException("Query scope must contain at least one project and source");
        }
        StringBuilder q = new StringBuilder("{");
        q.append(matcher("project", f.projectIds().stream().map(String::valueOf).collect(Collectors.toCollection(java.util.TreeSet::new))));
        q.append(',');
        q.append(matcher("source", f.sourceIds().stream().map(UUID::toString).collect(Collectors.toCollection(java.util.TreeSet::new))));
        if (f.environment() != null && !f.environment().isBlank()) {
            if (!ENVIRONMENT.matcher(f.environment()).matches()) throw new IllegalArgumentException("Invalid environment");
            q.append(",environment=\"").append(f.environment()).append('"');
        }
        if (f.container() != null && !f.container().isBlank()) {
            if (!CONTAINER.matcher(f.container()).matches()) throw new IllegalArgumentException("Invalid container");
            q.append(",container=\"").append(f.container()).append('"');
        }
        q.append('}');

        if (f.level() != null) {
            switch (f.level()) {
                case ERROR -> q.append(" |~ ").append(quote(ERROR_RE));
                case WARN -> q.append(" |~ ").append(quote(WARN_RE)).append(" !~ ").append(quote(ERROR_RE));
                case DEBUG -> q.append(" |~ ").append(quote(DEBUG_RE)).append(" !~ ").append(quote(ERROR_RE))
                        .append(" !~ ").append(quote(WARN_RE));
                case INFO -> q.append(" !~ ").append(quote(ERROR_RE)).append(" !~ ").append(quote(WARN_RE))
                        .append(" !~ ").append(quote(DEBUG_RE));
            }
        }
        if (f.text() != null && !f.text().isBlank()) {
            String t = f.text().trim();
            if (t.length() > MAX_TEXT_LENGTH) throw new IllegalArgumentException("Search text too long");
            for (int i = 0; i < t.length(); i++) {
                if (Character.isISOControl(t.charAt(i))) throw new IllegalArgumentException("Search text contains control characters");
            }
            q.append(" |~ ").append(quote("(?i)" + escapeRegex(t)));
        }
        return q.toString();
    }

    /** {@code label="x"} for one value, {@code label=~"a|b"} for several. Values are validated by the caller's types. */
    private static String matcher(String label, Collection<String> values) {
        for (String v : values) {
            if (!v.matches("^[0-9a-fA-F-]+$")) throw new IllegalArgumentException("Invalid " + label + " value");
        }
        return values.size() == 1
                ? label + "=\"" + values.iterator().next() + "\""
                : label + "=~\"" + String.join("|", values) + "\"";
    }

    /** Escapes RE2 metacharacters so user text is matched literally. */
    static String escapeRegex(String s) {
        StringBuilder b = new StringBuilder();
        for (char c : s.toCharArray()) {
            if ("\\.+*?()|[]{}^$".indexOf(c) >= 0) b.append('\\');
            b.append(c);
        }
        return b.toString();
    }

    /** Wraps in a LogQL double-quoted string, escaping backslashes and quotes. */
    static String quote(String s) {
        return '"' + s.replace("\\", "\\\\").replace("\"", "\\\"") + '"';
    }

    /** Level detection mirroring the filters above. */
    public static Level detectLevel(String line) {
        if (ERROR_P.matcher(line).find()) return Level.ERROR;
        if (WARN_P.matcher(line).find()) return Level.WARN;
        if (DEBUG_P.matcher(line).find()) return Level.DEBUG;
        return Level.INFO;
    }

    private static final Pattern ERROR_P = Pattern.compile(ERROR_RE);
    private static final Pattern WARN_P = Pattern.compile(WARN_RE);
    private static final Pattern DEBUG_P = Pattern.compile(DEBUG_RE);
}
