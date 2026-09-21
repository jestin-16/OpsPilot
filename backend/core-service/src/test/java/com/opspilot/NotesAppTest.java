package com.opspilot;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;

public class NotesAppTest {

    @Test
    @DisplayName("Deliberately broken test for CI/CD failure verification")
    void testValidationDeliberatelyFailing() {
        // Deliberately broken test: assertFalse(true)
        assertFalse(true, "Deliberately broken test: expected false but was true");
    }
}
