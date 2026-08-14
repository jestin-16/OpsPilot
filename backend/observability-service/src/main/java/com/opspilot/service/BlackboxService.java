package com.opspilot.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.net.InetAddress;
import java.net.Socket;
import java.net.InetSocketAddress;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import org.xbill.DNS.Lookup;
import org.xbill.DNS.Type;
import org.xbill.DNS.Record;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Aggregates real data from:
 *   1. Prometheus Blackbox Exporter (latency, TLS, SSL, cipher, redirects, HTTP version, etc.)
 *   2. ip-api.com free GeoIP API  (country, city, ISP, ASN — no key required)
 *   3. Direct HTTP header inspection (server type, CDN, security headers)
 *   4. Java DNS resolution          (IP addresses, IPv6 support)
 *   4. Java DNS resolution          (IP addresses, IPv6 support)
 */
@Service
public class BlackboxService {

    private final RestTemplate restTemplate;

    private final RestTemplate blackboxRestTemplate;
    private final RestTemplate externalRestTemplate;

    public BlackboxService() {
        this.restTemplate = new RestTemplate();
        org.springframework.http.client.SimpleClientHttpRequestFactory bbFactory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        bbFactory.setConnectTimeout(6000);
        bbFactory.setReadTimeout(6000);
        this.blackboxRestTemplate = new RestTemplate(bbFactory);

        org.springframework.http.client.SimpleClientHttpRequestFactory extFactory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        extFactory.setConnectTimeout(3000);
        extFactory.setReadTimeout(3000);
        this.externalRestTemplate = new RestTemplate(extFactory);
    }
    private static final String BLACKBOX_URL = "http://localhost:9115/probe";
    private static final String GEOIP_URL    = "http://ip-api.com/json/";

    @Autowired
    private BrowserProbeService browserProbeService;


    // ── Public API ─────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Map<String, Object> probeUrl(String url) {
        Map<String, Object> result = new LinkedHashMap<>();

        // 1. Blackbox Exporter — raw Prometheus text
        String prometheusText = fetchBlackbox(url);
        if (prometheusText != null) {
            parseBlackboxMetrics(prometheusText, result);
        } else {
            result.put("success",     0.0);
            result.put("httpStatus",  0.0);
            result.put("duration",    0.0);
            result.put("statusLabel", "UNREACHABLE");
            return result;
        }

        String hostname = extractHostname(url);
        List<String> ips = resolveIps(hostname);
        result.put("resolvedIps",  ips);
        result.put("ipv6Supported", ips.stream().anyMatch(ip -> ip.contains(":")));

        // Start all async tasks
        CompletableFuture<Map<String, Object>> geoFuture = CompletableFuture.supplyAsync(() -> 
            ips.isEmpty() ? new HashMap<>() : geoLookup(ips.get(0))
        );

        CompletableFuture<Map<String, Object>> headersFuture = CompletableFuture.supplyAsync(() -> 
            inspectHeaders(url)
        );

        CompletableFuture<Map<String, Object>> browserFuture = CompletableFuture.supplyAsync(() -> 
            browserProbeService.probeWithBrowser(url)
        );

        CompletableFuture<List<Integer>> portsFuture = CompletableFuture.supplyAsync(() -> 
            ips.isEmpty() ? new ArrayList<>() : scanPorts(ips.get(0))
        );

        CompletableFuture<Boolean> sqliFuture = CompletableFuture.supplyAsync(() -> 
            checkSqli(url)
        );

        CompletableFuture<List<String>> dnsFuture = CompletableFuture.supplyAsync(() -> 
            traceDns(hostname)
        );

        // Wait for all to complete
        CompletableFuture.allOf(geoFuture, headersFuture, browserFuture, portsFuture, sqliFuture, dnsFuture).join();

        // Populate results
        try {
            if (!ips.isEmpty()) {
                result.put("geo", geoFuture.get());
                result.put("openPorts", portsFuture.get());
            }
            result.put("headers", headersFuture.get());
            result.put("browser", browserFuture.get());
            result.put("sqliVulnerable", sqliFuture.get());
            result.put("dnsChain", dnsFuture.get());
        } catch (Exception e) {
            e.printStackTrace();
        }

        return result;
    }

    // ── Advanced Security & DNS ───────────────────────────────────────────────

    private List<Integer> scanPorts(String ip) {
        List<Integer> openPorts = new ArrayList<>();
        int[] ports = {22, 80, 443, 3306, 5432, 27017, 8080};
        for (int port : ports) {
            try (Socket socket = new Socket()) {
                socket.connect(new InetSocketAddress(ip, port), 500);
                openPorts.add(port);
            } catch (Exception ignored) {}
        }
        return openPorts;
    }

    private boolean checkSqli(String url) {
        try {
            String testUrl = url + (url.contains("?") ? "&" : "?") + "q=' OR '1'='1";
            ResponseEntity<String> resp = restTemplate.getForEntity(testUrl, String.class);
            String body = resp.getBody();
            if (body != null) {
                String lower = body.toLowerCase();
                return lower.contains("syntax error") || lower.contains("mysql_fetch") || lower.contains("ora-01756");
            }
        } catch (Exception ignored) {}
        return false;
    }

    private List<String> traceDns(String hostname) {
        List<String> chain = new ArrayList<>();
        try {
            Lookup lookup = new Lookup(hostname, Type.A);
            Record[] records = lookup.run();
            if (records != null) {
                for (Record r : records) {
                    chain.add(r.toString());
                }
            }
        } catch (Exception e) {
            chain.add("DNS Lookup Failed: " + e.getMessage());
        }
        return chain;
    }

    // ── Blackbox parsing ───────────────────────────────────────────────────────

    private String fetchBlackbox(String url) {
        try {
            String probeUrl = BLACKBOX_URL + "?module=http_2xx&target=" + url;
            ResponseEntity<String> resp = restTemplate.getForEntity(probeUrl, String.class);
            return resp.getBody();
        } catch (Exception e) {
            return null;
        }
    }

    private void parseBlackboxMetrics(String text, Map<String, Object> out) {
        double httpStatus    = metric(text, "probe_http_status_code ");
        double duration      = metric(text, "probe_duration_seconds ");
        double dnsSeconds    = metric(text, "probe_dns_lookup_time_seconds ");
        double connectSec    = phaseMetric(text, "connect");
        double tlsSec        = phaseMetric(text, "tls");
        double processSec    = phaseMetric(text, "processing");
        double transferSec   = phaseMetric(text, "transfer");
        double sslExpiry     = metric(text, "probe_ssl_earliest_cert_expiry ");
        double httpVersion   = metric(text, "probe_http_version ");
        double redirects     = metric(text, "probe_http_redirects ");
        double contentLen    = metric(text, "probe_http_uncompressed_body_length ");
        double isSSL         = metric(text, "probe_http_ssl ");
        double ipProtocol    = metric(text, "probe_ip_protocol ");
        double probeSuccess  = metric(text, "probe_success ");

        // Reachable = any HTTP response arrived
        boolean reachable = httpStatus > 0;

        out.put("success",        reachable ? 1.0 : 0.0);
        out.put("probeSuccess",   probeSuccess);
        out.put("httpStatus",     httpStatus);
        out.put("duration",       duration);
        out.put("dnsSeconds",     dnsSeconds);
        out.put("connectSeconds", connectSec);
        out.put("tlsSeconds",     tlsSec);
        out.put("processSeconds", processSec);
        out.put("transferSeconds",transferSec);
        out.put("sslExpiry",      sslExpiry);
        out.put("httpVersion",    httpVersion == 2 ? "HTTP/2" : httpVersion == 1 ? "HTTP/1.1" : "HTTP/1.0");
        out.put("redirects",      (int) redirects);
        out.put("contentLength",  (long) contentLen);
        out.put("isSSL",          isSSL == 1.0);
        out.put("ipProtocol",     ipProtocol == 6 ? "IPv6" : "IPv4");

        // TLS cipher + version
        out.put("tlsCipher",  labelMetric(text, "probe_tls_cipher_info",   "cipher"));
        out.put("tlsVersion", labelMetric(text, "probe_tls_version_info",  "version"));

        // SSL chain info
        out.put("certIssuer",  labelMetric(text, "probe_ssl_last_chain_info", "issuer"));
        out.put("certSubject", labelMetric(text, "probe_ssl_last_chain_info", "subject"));
        out.put("certSANs",    labelMetric(text, "probe_ssl_last_chain_info", "subjectalternative"));
        out.put("certSHA256",  labelMetric(text, "probe_ssl_last_chain_info", "fingerprint_sha256"));

        // Human-readable status
        out.put("statusLabel", statusLabel((int) httpStatus));
    }

    // ── DNS resolution ─────────────────────────────────────────────────────────

    private List<String> resolveIps(String hostname) {
        List<String> ips = new ArrayList<>();
        try {
            InetAddress[] addresses = InetAddress.getAllByName(hostname);
            for (InetAddress addr : addresses) {
                ips.add(addr.getHostAddress());
            }
        } catch (Exception ignored) {}
        return ips;
    }

    // ── GeoIP ──────────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> geoLookup(String ip) {
        Map<String, Object> geo = new LinkedHashMap<>();
        try {
            ResponseEntity<Map> resp = restTemplate.getForEntity(GEOIP_URL + ip, Map.class);
            Map<String, Object> body = resp.getBody();
            if (body != null && "success".equals(body.get("status"))) {
                geo.put("ip",          ip);
                geo.put("country",     body.get("country"));
                geo.put("countryCode", body.get("countryCode"));
                geo.put("region",      body.get("regionName"));
                geo.put("city",        body.get("city"));
                geo.put("isp",         body.get("isp"));
                geo.put("org",         body.get("org"));
                geo.put("as",          body.get("as"));
                geo.put("lat",         body.get("lat"));
                geo.put("lon",         body.get("lon"));
                geo.put("timezone",    body.get("timezone"));
            }
        } catch (Exception e) {
            geo.put("error", e.getMessage());
        }
        return geo;
    }

    // ── HTTP header inspection ─────────────────────────────────────────────────

    private Map<String, Object> inspectHeaders(String url) {
        Map<String, Object> info = new LinkedHashMap<>();
        try {
            HttpHeaders reqHeaders = new HttpHeaders();
            reqHeaders.set("User-Agent", "OpsPilot-Monitor/1.0");
            HttpEntity<Void> entity = new HttpEntity<>(reqHeaders);

            ResponseEntity<String> resp = restTemplate.exchange(
                url, HttpMethod.HEAD, entity, String.class
            );
            HttpHeaders h = resp.getHeaders();

            info.put("server",            h.getFirst("Server"));
            info.put("poweredBy",         h.getFirst("X-Powered-By"));
            info.put("contentType",       h.getFirst("Content-Type"));
            info.put("cacheControl",      h.getFirst("Cache-Control"));
            info.put("via",               h.getFirst("Via"));
            info.put("xCache",            h.getFirst("X-Cache"));
            info.put("xCacheHit",         h.getFirst("X-Cache-Hit"));

            // Security headers
            Map<String, Object> security = new LinkedHashMap<>();
            security.put("hsts",              h.getFirst("Strict-Transport-Security"));
            security.put("csp",               h.getFirst("Content-Security-Policy") != null ? "Present" : null);
            security.put("xFrameOptions",     h.getFirst("X-Frame-Options"));
            security.put("xContentTypeOpts",  h.getFirst("X-Content-Type-Options"));
            security.put("xXSSProtection",    h.getFirst("X-XSS-Protection"));
            security.put("referrerPolicy",    h.getFirst("Referrer-Policy"));
            security.put("permissionsPolicy", h.getFirst("Permissions-Policy") != null ? "Present" : null);
            info.put("security", security);

            // CDN detection
            info.put("cdn", detectCdn(h));

            // Compute security score (0–7)
            long score = security.values().stream().filter(Objects::nonNull).count();
            info.put("securityScore",    score);
            info.put("securityMaxScore", 7L);

        } catch (Exception e) {
            // HEAD may fail; try GET with small range
            try {
                HttpHeaders reqHeaders = new HttpHeaders();
                reqHeaders.set("User-Agent",  "OpsPilot-Monitor/1.0");
                reqHeaders.set("Range",       "bytes=0-0");
                HttpEntity<Void> entity = new HttpEntity<>(reqHeaders);
                ResponseEntity<String> resp = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
                info.put("server",  resp.getHeaders().getFirst("Server"));
                info.put("cdn",     detectCdn(resp.getHeaders()));
                info.put("error",   null);
            } catch (Exception e2) {
                info.put("error", "Header inspection unavailable: " + e2.getMessage());
            }
        }
        return info;
    }

    private String detectCdn(HttpHeaders h) {
        if (h.getFirst("CF-Ray")          != null) return "Cloudflare";
        if (h.getFirst("X-Amz-Cf-Id")    != null) return "AWS CloudFront";
        if (h.getFirst("X-Azure-Ref")     != null) return "Azure CDN";
        if (h.getFirst("X-Fastly-Request-ID") != null) return "Fastly";
        if (h.getFirst("X-Akamai-Request-ID") != null) return "Akamai";
        if (h.getFirst("X-Cache")         != null) return "Generic CDN (cache hit)";
        if (h.getFirst("Via")             != null) return "Proxy / CDN";
        return "None detected";
    }

    // ── Parsing helpers ────────────────────────────────────────────────────────

    private double metric(String text, String prefix) {
        for (String line : text.split("\n")) {
            if (line.startsWith(prefix) && !line.startsWith("#")) {
                try { return Double.parseDouble(line.substring(prefix.length()).trim()); }
                catch (NumberFormatException ignored) {}
            }
        }
        return 0.0;
    }

    private double phaseMetric(String text, String phase) {
        String prefix = "probe_http_duration_seconds{phase=\"" + phase + "\"}";
        for (String line : text.split("\n")) {
            if (line.startsWith(prefix)) {
                try { return Double.parseDouble(line.substring(prefix.length()).trim()); }
                catch (NumberFormatException ignored) {}
            }
        }
        return 0.0;
    }

    /** Extract the value of a label from a Prometheus info metric line. */
    private String labelMetric(String text, String metricName, String labelKey) {
        for (String line : text.split("\n")) {
            if (line.startsWith(metricName + "{") && !line.startsWith("#")) {
                String search = labelKey + "=\"";
                int start = line.indexOf(search);
                if (start >= 0) {
                    start += search.length();
                    int end = line.indexOf("\"", start);
                    if (end >= 0) return line.substring(start, end);
                }
            }
        }
        return null;
    }

    private String extractHostname(String url) {
        try {
            return new java.net.URL(url).getHost();
        } catch (Exception e) {
            return url;
        }
    }

    private String statusLabel(int status) {
        if (status == 0)   return "UNREACHABLE";
        if (status < 200)  return "INFORMATIONAL";
        if (status < 300)  return "OK";
        if (status < 400)  return "REDIRECT";
        if (status == 403) return "BOT BLOCKED (403)";
        if (status == 404) return "NOT FOUND (404)";
        if (status < 500)  return "CLIENT ERROR";
        return "SERVER ERROR";
    }
}
