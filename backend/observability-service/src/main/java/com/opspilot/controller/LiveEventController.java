package com.opspilot.controller;

import com.opspilot.service.PostHogService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.Random;

@RestController
@RequestMapping("/api/v1/monitoring/live-events")
public class LiveEventController {

    private final PostHogService postHogService;
    private final Random random = new Random();

    public LiveEventController(PostHogService postHogService) {
        this.postHogService = postHogService;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamEvents() {
        SseEmitter emitter = new SseEmitter(60000L); // 60 seconds timeout
        
        ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();
        
        executor.scheduleAtFixedRate(() -> {
            try {
                // Generate 0 to 3 events per tick to simulate realistic sporadic traffic
                int count = random.nextInt(4);
                if (count > 0) {
                    List<Map<String, Object>> events = postHogService.fetchRecentEvents(count);
                    for (Map<String, Object> event : events) {
                        emitter.send(SseEmitter.event()
                                .name("posthog-event")
                                .data(event));
                    }
                }
            } catch (IOException e) {
                emitter.completeWithError(e);
                executor.shutdown();
            } catch (Exception e) {
                emitter.completeWithError(e);
                executor.shutdown();
            }
        }, 0, 1, TimeUnit.SECONDS);

        emitter.onCompletion(executor::shutdown);
        emitter.onTimeout(executor::shutdown);
        emitter.onError(e -> executor.shutdown());

        return emitter;
    }
}
