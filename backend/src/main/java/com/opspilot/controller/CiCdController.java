package com.opspilot.controller;

import com.opspilot.entity.PipelineRunEntity;
import com.opspilot.repository.PipelineRunRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/cicd", "/api/cicd"})
public class CiCdController {

    @Autowired
    private PipelineRunRepository pipelineRunRepository;

    @GetMapping("/runs")
    public ResponseEntity<List<PipelineRunEntity>> getPipelineRuns() {
        return ResponseEntity.ok(pipelineRunRepository.findAllByOrderByCreatedAtDesc());
    }
}
