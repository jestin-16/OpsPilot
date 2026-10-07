package com.opspilot.security.ingest;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class IngestTokenServiceTest {

    private final IngestTokenService service = new IngestTokenService();

    @Test
    void generatedTokenHasPrefixAndIsUnique() {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 200; i++) {
            String t = service.generate();
            assertTrue(t.startsWith("opl_"));
            assertTrue(t.length() >= 40);
            assertTrue(t.matches("^opl_[A-Za-z0-9_-]+$"), "token must be URL-safe");
            assertTrue(seen.add(t), "tokens must not repeat");
        }
    }

    @Test
    void hashIsSha256HexAndDeterministic() {
        // Known SHA-256 test vector for "abc"
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", service.hash("abc"));
        String t = service.generate();
        assertEquals(service.hash(t), service.hash(t));
        assertEquals(64, service.hash(t).length());
        assertNotEquals(t, service.hash(t));
    }

    @Test
    void matchesAcceptsOnlyTheOriginalToken() {
        String t = service.generate();
        String stored = service.hash(t);
        assertTrue(service.matches(t, stored));
        assertFalse(service.matches(service.generate(), stored));
        assertFalse(service.matches(t + "x", stored));
        assertFalse(service.matches(null, stored));
        assertFalse(service.matches(t, null));
    }

    @Test
    void displayPrefixRevealsOnlyTheStart() {
        String t = service.generate();
        String p = service.displayPrefix(t);
        assertEquals(12, p.length());
        assertTrue(t.startsWith(p));
    }
}
