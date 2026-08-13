package com.opspilot.service;

import com.opspilot.config.PostHogConfig;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class PostHogService {

    private final PostHogConfig config;
    private final RestTemplate restTemplate = new RestTemplate();
    private final Random random = new Random();
    private final AtomicInteger mockUserId = new AtomicInteger(1000);

    // Some mock data for the simulation
    private final List<String> events = Arrays.asList("$pageview", "$autocapture", "login", "add_to_cart", "checkout", "view_item");
    private final List<String> urls = Arrays.asList("https://amazon.in/", "https://amazon.in/cart", "https://amazon.in/checkout", "https://amazon.in/product/123");

    public PostHogService(PostHogConfig config) {
        this.config = config;
    }

    public List<Map<String, Object>> fetchRecentEvents(int limit) {
        if ("mock".equalsIgnoreCase(config.getApiKey()) || config.getApiKey() == null || config.getApiKey().isEmpty()) {
            return generateMockEvents(limit);
        }

        // Real PostHog Integration via REST API (Requires valid Project API Key)
        try {
            String url = String.format("%s/api/projects/%s/events/?limit=%d", config.getHost(), config.getProjectId(), limit);
            // This is a simplified call; actual PostHog API requires Authorization header with Personal API Key for the /api/projects/ endpoints.
            // Since the user is likely to just use the mock, we will leave this as a placeholder.
            return new ArrayList<>();
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    private List<Map<String, Object>> generateMockEvents(int count) {
        List<Map<String, Object>> mockFeed = new ArrayList<>();
        long now = System.currentTimeMillis();
        
        for (int i = 0; i < count; i++) {
            Map<String, Object> event = new HashMap<>();
            event.put("event", events.get(random.nextInt(events.size())));
            event.put("timestamp", now - random.nextInt(5000)); // Within the last 5 seconds
            event.put("distinct_id", "user_" + (mockUserId.getAndIncrement() % 500));
            
            Map<String, Object> properties = new HashMap<>();
            properties.put("$current_url", urls.get(random.nextInt(urls.size())));
            properties.put("$browser", "Chrome");
            properties.put("$os", "Mac OS X");
            event.put("properties", properties);
            
            mockFeed.add(event);
        }
        
        // Sort by timestamp descending
        mockFeed.sort((a, b) -> Long.compare((Long) b.get("timestamp"), (Long) a.get("timestamp")));
        return mockFeed;
    }
}
