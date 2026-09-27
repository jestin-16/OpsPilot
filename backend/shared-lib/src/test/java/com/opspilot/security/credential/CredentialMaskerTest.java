package com.opspilot.security.credential;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class CredentialMaskerTest {

    @Test
    void testMaskPassword() {
        String input = "password=SuperSecret123";
        String expected = "password=********";
        assertEquals(expected, CredentialMasker.mask(input));
    }

    @Test
    void testMaskTokenInJson() {
        String input = "{\"token\":\"abc123xyz\", \"user\":\"admin\"}";
        String expected = "{\"token\":\"********\", \"user\":\"admin\"}";
        assertEquals(expected, CredentialMasker.mask(input));
    }

    @Test
    void testMaskAccessKey() {
        String input = "Connecting with access_key: AKIAIOSFODNN7EXAMPLE";
        String expected = "Connecting with access_key: ********";
        assertEquals(expected, CredentialMasker.mask(input));
    }

    @Test
    void testMaskSecretKey() {
        String input = "AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
        String expected = "AWS_SECRET_KEY=********";
        assertEquals(expected, CredentialMasker.mask(input));
    }

    @Test
    void testNoFalsePositives() {
        String input = "This is a normal log message.";
        assertEquals(input, CredentialMasker.mask(input));
    }
}
