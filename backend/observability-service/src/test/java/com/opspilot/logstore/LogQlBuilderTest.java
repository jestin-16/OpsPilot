package com.opspilot.logstore;

import com.opspilot.logstore.LogQlBuilder.Filter;
import com.opspilot.logstore.LogQlBuilder.Level;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

class LogQlBuilderTest {

    private static final UUID S1 = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID S2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    private Filter filter(String env, String container, Level level, String text) {
        return new Filter(List.of(7L), List.of(S1), env, container, level, text);
    }

    @Test
    void scopeMatchersAreAlwaysPresent() {
        assertEquals("{project=\"7\",source=\"" + S1 + "\"}", LogQlBuilder.build(filter(null, null, null, null)));
    }

    @Test
    void multipleProjectsAndSourcesUseRegexAlternationInStableOrder() {
        String q = LogQlBuilder.build(new Filter(List.of(9L, 7L), List.of(S2, S1), null, null, null, null));
        assertEquals("{project=~\"7|9\",source=~\"" + S1 + "|" + S2 + "\"}", q);
    }

    @Test
    void environmentContainerLevelAndTextAreApplied() {
        String q = LogQlBuilder.build(filter("prod", "web-1", Level.ERROR, "timeout"));
        assertTrue(q.startsWith("{project=\"7\",source=\"" + S1 + "\",environment=\"prod\",container=\"web-1\"}"));
        assertTrue(q.contains(" |~ \"(?i)(\\\\b(error|fatal|panic|critical)\\\\b|exception)\""));
        assertTrue(q.endsWith(" |~ \"(?i)timeout\""));
    }

    @Test
    void emptyScopeIsRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> LogQlBuilder.build(new Filter(List.of(), List.of(S1), null, null, null, null)));
        assertThrows(IllegalArgumentException.class,
                () -> LogQlBuilder.build(new Filter(List.of(7L), List.of(), null, null, null, null)));
        assertThrows(IllegalArgumentException.class,
                () -> LogQlBuilder.build(new Filter(null, null, null, null, null, null)));
    }

    // ---- injection attempts ---------------------------------------------------------------------------------

    @Test
    void textCannotBreakOutOfTheStringLiteral() {
        String q = LogQlBuilder.build(filter(null, null, null, "x\" } | json | project=\"999"));
        // every quote from the user is escaped, so the only unescaped quotes are the filter's own delimiters
        String tail = q.substring(q.indexOf(" |~ "));
        assertEquals(1, tail.split(Pattern.quote(" |~ ")).length - 1);
        String unescapedQuotes = tail.replace("\\\"", "");
        assertEquals(2, unescapedQuotes.chars().filter(c -> c == '"').count(), tail);
        assertFalse(q.contains("project=\"999\""), "injected matcher must not appear unescaped");
    }

    @Test
    void textBackslashesAndRegexMetacharactersAreEscaped() {
        String q = LogQlBuilder.build(filter(null, null, null, "a.b*c\\d(e)"));
        assertTrue(q.endsWith("\"(?i)a\\\\.b\\\\*c\\\\\\\\d\\\\(e\\\\)\""), q);
    }

    @Test
    void textWithControlCharactersOrExcessiveLengthIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> LogQlBuilder.build(filter(null, null, null, "a\nb")));
        assertThrows(IllegalArgumentException.class, () -> LogQlBuilder.build(filter(null, null, null, "a\u0000b")));
        assertThrows(IllegalArgumentException.class, () -> LogQlBuilder.build(filter(null, null, null, "x".repeat(201))));
    }

    @Test
    void environmentInjectionIsRejected() {
        for (String bad : List.of("prod\"}|=\"", "prod,project=~\".+\"", "PROD", "a b", "../x", "prod\n")) {
            assertThrows(IllegalArgumentException.class, () -> LogQlBuilder.build(filter(bad, null, null, null)), bad);
        }
    }

    @Test
    void containerInjectionIsRejected() {
        for (String bad : List.of("web\"}", "web\",project=~\".+", "a b", "web{", "x".repeat(129), "web\\")) {
            assertThrows(IllegalArgumentException.class, () -> LogQlBuilder.build(filter(null, bad, null, null)), bad);
        }
    }

    @Test
    void levelParsingRejectsUnknownValues() {
        assertNull(Level.parse(null));
        assertNull(Level.parse("ALL"));
        assertEquals(Level.WARN, Level.parse("warn"));
        assertThrows(IllegalArgumentException.class, () -> Level.parse("error\"} or {"));
    }

    @Test
    void levelFiltersAreMutuallyConsistentWithDetection() {
        assertEquals(Level.ERROR, LogQlBuilder.detectLevel("ERROR db down"));
        assertEquals(Level.ERROR, LogQlBuilder.detectLevel("java.lang.NullPointerException"));
        assertEquals(Level.WARN, LogQlBuilder.detectLevel("WARN slow query"));
        assertEquals(Level.DEBUG, LogQlBuilder.detectLevel("debug: x"));
        assertEquals(Level.INFO, LogQlBuilder.detectLevel("started in 2s"));
        assertEquals(Level.INFO, LogQlBuilder.detectLevel("terrorism"), "word boundaries: not a substring match");

        String warn = LogQlBuilder.build(filter(null, null, Level.WARN, null));
        assertTrue(warn.contains("|~") && warn.contains("!~"));
        String info = LogQlBuilder.build(filter(null, null, Level.INFO, null));
        assertEquals(3, info.split("!~", -1).length - 1);
    }
}
