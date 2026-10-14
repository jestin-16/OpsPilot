package com.opspilot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.dto.ProjectCreateRequest;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** The create-project payload the UI sends: "name" alias, environment, optional fields omitted. */
class ProjectCreateRequestBindingTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    private static int violations(String json) throws Exception {
        ProjectCreateRequest r = JSON.readValue(json, ProjectCreateRequest.class);
        return Validation.buildDefaultValidatorFactory().getValidator().validate(r).size();
    }

    @Test
    void uiPayloadBindsAndValidates() throws Exception {
        ProjectCreateRequest r = JSON.readValue("{\"name\":\"Payments\",\"environment\":\"staging\"}", ProjectCreateRequest.class);
        assertEquals("Payments", r.getProjectName());
        assertEquals("staging", r.getEnvironment());
        assertEquals(0, violations("{\"name\":\"Payments\",\"environment\":\"staging\",\"description\":\"d\",\"repositoryUrl\":\"https://github.com/a/b\"}"));
    }

    @Test
    void legacyProjectNameStillWorksAndBadValuesAreRejected() throws Exception {
        assertEquals(0, violations("{\"projectName\":\"Old\"}"));
        assertEquals(1, violations("{\"name\":\"X\",\"environment\":\"qa\"}"));
        assertEquals(1, violations("{\"name\":\"X\",\"repositoryUrl\":\"https://example.com/a\"}"));
    }
}
