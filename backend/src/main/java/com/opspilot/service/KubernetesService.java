package com.opspilot.service;

import com.opspilot.entity.PodEntity;
import com.opspilot.repository.PodRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class KubernetesService {

    @Autowired
    private PodRepository podRepository;

    public List<PodEntity> getAllPods() {
        return podRepository.findAll();
    }
}
