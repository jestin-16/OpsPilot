package com.opspilot.config;

import com.opspilot.entity.ContainerEntity;
import com.opspilot.entity.Deployment;
import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.repository.ContainerRepository;
import com.opspilot.repository.DeploymentRepository;
import com.opspilot.repository.ProjectRepository;
import com.opspilot.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class CoreDataInitializer implements CommandLineRunner {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DeploymentRepository deploymentRepository;

    @Autowired
    private ContainerRepository containerRepository;

    @Autowired
    private com.opspilot.repository.PodRepository podRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (containerRepository.count() == 0) {
            User dev = userRepository.findByEmail("developer@opspilot.io").orElse(null);
            User devops = userRepository.findByEmail("devops@opspilot.io").orElse(null);

            if (dev != null) {
                Project p1 = projectRepository.save(new Project("Demo Project 1", "Fixture 1", "https://github.com/demo/1", dev, "ACTIVE"));
                Deployment d1 = deploymentRepository.save(new Deployment(p1, dev, "v1", "Production", "Running"));
                ContainerEntity c1 = containerRepository.save(new ContainerEntity(d1, "nginx:latest", "RUNNING"));
                podRepository.save(new com.opspilot.entity.PodEntity("nginx-latest-pod", "default", c1, "minikube", "Running", "100m", "128Mi"));
            }

            if (devops != null) {
                Project p2 = projectRepository.save(new Project("Demo Project 2", "Fixture 2", "https://github.com/demo/2", devops, "ACTIVE"));
                Deployment d2 = deploymentRepository.save(new Deployment(p2, devops, "v1", "Production", "Running"));
                containerRepository.save(new ContainerEntity(d2, "redis:latest", "RUNNING"));
            }
        }
    }
}
