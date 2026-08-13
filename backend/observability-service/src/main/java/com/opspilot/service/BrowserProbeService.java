package com.opspilot.service;

import com.microsoft.playwright.*;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BrowserProbeService {

    private Playwright playwright;
    private Browser browser;

    @PostConstruct
    public void init() {
        playwright = Playwright.create();
        browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
    }

    @PreDestroy
    public void close() {
        if (browser != null) browser.close();
        if (playwright != null) playwright.close();
    }

    public Map<String, Object> probeWithBrowser(String url) {
        Map<String, Object> result = new LinkedHashMap<>();
        List<String> consoleErrors = new ArrayList<>();
        List<Map<String, Object>> networkWaterfall = new ArrayList<>();

        try (BrowserContext context = browser.newContext();
             Page page = context.newPage()) {

            // Intercept console errors
            page.onConsoleMessage(msg -> {
                if ("error".equals(msg.type())) {
                    consoleErrors.add(msg.text());
                }
            });
            page.onPageError(msg -> {
                consoleErrors.add(msg);
            });

            // Intercept network waterfall
            page.onRequestFinished(req -> {
                Map<String, Object> reqInfo = new HashMap<>();
                reqInfo.put("url", req.url());
                reqInfo.put("method", req.method());
                reqInfo.put("resourceType", req.resourceType());
                
                Response resp = req.response();
                if (resp != null) {
                    reqInfo.put("status", resp.status());
                } else {
                    reqInfo.put("status", 0);
                }
                networkWaterfall.add(reqInfo);
            });

            page.navigate(url, new Page.NavigateOptions().setTimeout(10000));
            
            // Wait a little for async scripts and vitals
            page.waitForTimeout(1000);

            // Fetch performance metrics
            Object lcpObj = page.evaluate("() => { " +
                    "  const entries = performance.getEntriesByType('paint'); " +
                    "  const lcp = entries.find(e => e.name === 'largest-contentful-paint'); " +
                    "  return lcp ? lcp.startTime : null; " +
                    "}");
            
            Object fpObj = page.evaluate("() => { " +
                    "  const entries = performance.getEntriesByType('paint'); " +
                    "  const fp = entries.find(e => e.name === 'first-paint'); " +
                    "  return fp ? fp.startTime : null; " +
                    "}");

            result.put("consoleErrors", consoleErrors);
            result.put("waterfallCount", networkWaterfall.size());
            result.put("lcp", lcpObj != null ? lcpObj : 0);
            result.put("firstPaint", fpObj != null ? fpObj : 0);

        } catch (Exception e) {
            result.put("browserError", e.getMessage());
        }

        return result;
    }
}
