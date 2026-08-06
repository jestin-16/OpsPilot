package com.opspilot.controller;

import com.opspilot.dto.AiDiagnosisResponse;
import com.opspilot.dto.AiQueryRequest;
import com.opspilot.service.AiAssistantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/ai", "/api/ai"})
public class AiAssistantController {

    @Autowired
    private AiAssistantService aiAssistantService;

    @PostMapping("/query")
    public ResponseEntity<AiDiagnosisResponse> queryAi(@RequestBody AiQueryRequest request) {
        return ResponseEntity.ok(aiAssistantService.diagnose(request));
    }
}
