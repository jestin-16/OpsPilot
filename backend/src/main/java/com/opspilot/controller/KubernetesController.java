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
}
