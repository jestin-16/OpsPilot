package com.opspilot.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;

@Entity
@Table(name = "integration_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntegrationSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String providerType; // AWS, LOKI, ELK, etc.

    @Column(nullable = false)
    private String name; // e.g., "Production AWS"

    @Column(length = 2000)
    private String configJson; // JSON payload holding region, access keys, or endpoint URLs

    @Column(nullable = false)
    private boolean active = true;

    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
