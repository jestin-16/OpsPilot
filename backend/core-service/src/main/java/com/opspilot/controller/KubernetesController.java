package com.opspilot.controller;

import com.opspilot.entity.PodEntity;
import com.opspilot.service.KubernetesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/kubernetes", "/api/kubernetes"})
public class KubernetesController {

    @Autowired
    private KubernetesService kubernetesService;

    @GetMapping("/pods")
    public ResponseEntity<List<PodEntity>> getPods() {
        return ResponseEntity.ok(kubernetesService.getAllPods());
    }

    @GetMapping("/overview")
    public ResponseEntity<java.util.Map<String, Object>> getOverview() {
        return ResponseEntity.ok(kubernetesService.getClusterOverview());
    }

    @GetMapping("/nodes")
    public ResponseEntity<List<java.util.Map<String, Object>>> getNodes() {
        return ResponseEntity.ok(kubernetesService.getNodes());
    }

    @GetMapping("/services")
    public ResponseEntity<List<java.util.Map<String, Object>>> getServices() {
        return ResponseEntity.ok(kubernetesService.getServices());
    }

    @GetMapping("/namespaces")
    public ResponseEntity<List<java.util.Map<String, Object>>> getNamespaces() {
        return ResponseEntity.ok(kubernetesService.getNamespaces());
    }

    @GetMapping("/enhanced-pods")
    public ResponseEntity<List<java.util.Map<String, Object>>> getEnhancedPods() {
        return ResponseEntity.ok(kubernetesService.getEnhancedPods());
    }

    @GetMapping("/pods/{namespace}/{name}")
    public ResponseEntity<java.util.Map<String, Object>> getPodDetails(
            @org.springframework.web.bind.annotation.PathVariable String namespace,
            @org.springframework.web.bind.annotation.PathVariable String name) {
        return ResponseEntity.ok(kubernetesService.getPodDetails(namespace, name));
    }
}
