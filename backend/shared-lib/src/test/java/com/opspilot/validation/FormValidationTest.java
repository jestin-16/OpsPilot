package com.opspilot.validation;

import com.opspilot.dto.*;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;

class FormValidationTest {
    private static final ValidatorFactory FACTORY = Validation.buildDefaultValidatorFactory();
    private static final Validator VALIDATOR = FACTORY.getValidator();
    @AfterAll static void closeFactory() { FACTORY.close(); }

    @ParameterizedTest
    @ValueSource(strings = {"Alice123", "<script>Alice</script>", "Alice\nSmith", "123", "\u0301"})
    void rejectsInvalidNames(String name) {
        assertFalse(VALIDATOR.validate(new RegisterRequest(name, "alice@example.com", "Password123!", "Developer")).isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"李", "محمد علي", "Ana María O’Neill", "Jean-Luc Picard"})
    void acceptsInternationalNames(String name) {
        assertTrue(VALIDATOR.validate(new RegisterRequest(name, "alice+work@example.com", "Password123!", "Developer")).isEmpty());
    }

    @Test void checksPasswordBytesWithoutApplyingSignupComplexityToLogin() {
        assertTrue(VALIDATOR.validate(new AuthRequest("alice@example.com", "legacy")).isEmpty());
        assertFalse(VALIDATOR.validate(new AuthRequest("alice@example.com", "x".repeat(73))).isEmpty());
        assertTrue(VALIDATOR.validate(new RegisterRequest("Alice", "alice@example.com", "Aa1" + "🙂".repeat(17), "DevOps")).isEmpty());
        assertFalse(VALIDATOR.validate(new RegisterRequest("Alice", "alice@example.com", "Aa1" + "🙂".repeat(18), "DevOps")).isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"alice", "alice@example", "alice@@example.com", ".alice@example.com"})
    void rejectsMalformedEmails(String email) {
        assertFalse(VALIDATOR.validate(new AuthRequest(email, "legacy")).isEmpty());
    }

    @Test void validatesProjectDetailsWhileAllowingPartialUpdates() {
        ProjectRequest update = new ProjectRequest();
        update.setStatus("ACTIVE");
        assertTrue(VALIDATOR.validate(update).isEmpty());
        update.setProjectName("<Project>");
        assertFalse(VALIDATOR.validate(update).isEmpty());
        ProjectCreateRequest create = new ProjectCreateRequest();
        create.setProjectName("Shop API");
        create.setRepositoryUrl("https://github.com/acme/shop");
        create.setEnvironment("dev");
        assertTrue(VALIDATOR.validate(create).isEmpty());
        create.setRepositoryUrl("https://github.com");
        assertFalse(VALIDATOR.validate(create).isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"http://", "http://:80", "http://host:99999", "http://host:0", "http://user:pass@host", "ftp://host"})
    void rejectsMalformedEndpoints(String url) {
        assertThrows(IllegalArgumentException.class, () -> FormChecks.endpoint(url, "Endpoint", false));
    }

    @Test void acceptsInternalEndpointsAndOnlyPermitsTcpForDocker() {
        assertDoesNotThrow(() -> FormChecks.endpoint("https://kubernetes:6443", "Endpoint", false));
        assertDoesNotThrow(() -> FormChecks.endpoint("tcp://docker:2375", "Endpoint", true));
        assertThrows(IllegalArgumentException.class, () -> FormChecks.endpoint("tcp://docker:2375", "Endpoint", false));
    }

    @ParameterizedTest
    @ValueSource(strings = {"null", "[]", "42", "\"text\"", "{invalid}", "{} trailing"})
    void requiresJsonObjects(String value) {
        assertThrows(IllegalArgumentException.class, () -> FormChecks.jsonObject(value, "Configuration"));
    }

    @Test void permitsMultilineDescriptionsButRejectsControlCharacters() {
        assertDoesNotThrow(() -> FormChecks.text("First\nSecond\tDetail", "Description", 1000));
        assertThrows(IllegalArgumentException.class, () -> FormChecks.text("Null\u0000", "Description", 1000));
    }
}
