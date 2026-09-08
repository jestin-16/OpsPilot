package com.opspilot.repository;

import com.opspilot.entity.ContainerEntity;
import com.opspilot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContainerRepository extends JpaRepository<ContainerEntity, Long> {
    List<ContainerEntity> findByDeploymentId(Long deploymentId);
    List<ContainerEntity> findByDeployment_DeployedBy(User deployedBy);
}
