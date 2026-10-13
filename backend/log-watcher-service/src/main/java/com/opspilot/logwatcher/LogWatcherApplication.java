package com.opspilot.logwatcher;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LogWatcherApplication {

    public static void main(String[] args) {
        SpringApplication.run(LogWatcherApplication.class, args);
    }
}
