package com.opspilot.logwatcher.controller;

import com.opspilot.logwatcher.model.PodSummaryDto;
import com.opspilot.logwatcher.service.KubernetesPodWatcher;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/pods", "/api/v1/pods"})
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PodController {

    private final KubernetesPodWatcher podWatcher;

    public PodController(KubernetesPodWatcher podWatcher) {
        this.podWatcher = podWatcher;
    }

    @GetMapping
    public ResponseEntity<List<PodSummaryDto>> getPods() {
        return ResponseEntity.ok(podWatcher.getAllPods());
    }

    @GetMapping("/{namespace}/{pod}")
    public ResponseEntity<PodSummaryDto> getPod(@PathVariable String namespace, @PathVariable String pod) {
        return podWatcher.getPod(namespace, pod)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
