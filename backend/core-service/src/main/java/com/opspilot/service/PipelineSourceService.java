package com.opspilot.service;

import com.opspilot.dto.PipelineSourceRequest;
import com.opspilot.dto.PipelineSourceResponse;
import com.opspilot.entity.PipelineSource;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.PipelineRunRepository;
import com.opspilot.repository.PipelineSourceRepository;
import com.opspilot.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class PipelineSourceService {

    private static final Pattern REPO_PATTERN = Pattern.compile("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$");
    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired
    private PipelineSourceRepository sourceRepository;

    @Autowired
    private PipelineRunRepository pipelineRunRepository;

    @Autowired
    private ProjectRepository projectRepository;

    private final RestTemplate restTemplate = buildRestTemplate();

    private static RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(5000);
        f.setReadTimeout(8000);
        return new RestTemplate(f);
    }

    public List<PipelineSourceResponse> list() {
        return sourceRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    public PipelineSourceResponse get(Long id) {
        return toResponse(find(id));
    }

    public PipelineSource find(Long id) {
        return sourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline source not found with id: " + id));
    }

    public PipelineSourceResponse create(PipelineSourceRequest req) {
        PipelineSource s = new PipelineSource();
        s.setProvider(normalizeProvider(req.getProvider()));
        apply(s, req, true);
        String secret = generateSecret();
        s.setWebhookSecret(secret);
        s.setEnabled(req.getEnabled() == null || req.getEnabled());
        return toResponse(sourceRepository.save(s)).withWebhookSecret(secret);
    }

    public PipelineSourceResponse update(Long id, PipelineSourceRequest req) {
        PipelineSource s = find(id);
        if (req.getProvider() != null && !req.getProvider().equalsIgnoreCase(s.getProvider())) {
            throw new IllegalArgumentException("Provider cannot be changed; create a new source instead");
        }
        apply(s, req, false);
        if (req.getEnabled() != null) s.setEnabled(req.getEnabled());
        return toResponse(sourceRepository.save(s));
    }

    public void delete(Long id) {
        sourceRepository.delete(find(id));
    }

    /** Explicit rotate: returns the new secret exactly once. */
    public PipelineSourceResponse regenerateSecret(Long id) {
        PipelineSource s = find(id);
        String secret = generateSecret();
        s.setWebhookSecret(secret);
        return toResponse(sourceRepository.save(s)).withWebhookSecret(secret);
    }

    /** Explicit reveal of the current secret. */
    public PipelineSourceResponse revealSecret(Long id) {
        PipelineSource s = find(id);
        return toResponse(s).withWebhookSecret(s.getWebhookSecret());
    }

    public Map<String, Object> testConnection(Long id) {
        PipelineSource s = find(id);
        Map<String, Object> result = new HashMap<>();
        try {
            if (PipelineSource.GITHUB_ACTIONS.equals(s.getProvider())) {
                if (s.getAccessToken() == null || s.getAccessToken().isBlank()) {
                    result.put("success", true);
                    result.put("message", "No access token configured; repository was not verified. Webhooks will still work.");
                    return result;
                }
                HttpHeaders h = new HttpHeaders();
                h.set("User-Agent", "OpsPilot");
                h.set("Accept", "application/vnd.github+json");
                h.setBearerAuth(s.getAccessToken());
                restTemplate.exchange("https://api.github.com/repos/" + s.getRepoFullName(), HttpMethod.GET, new HttpEntity<>(h), String.class);
                result.put("success", true);
                result.put("message", "Repository " + s.getRepoFullName() + " is reachable.");
            } else {
                String base = s.getBaseUrl().replaceAll("/+$", "");
                String url = base + "/job/" + s.getJobName() + "/api/json";
                HttpHeaders h = new HttpHeaders();
                h.set("User-Agent", "OpsPilot");
                if (notBlank(s.getUsername()) && notBlank(s.getApiToken())) h.setBasicAuth(s.getUsername(), s.getApiToken());
                restTemplate.exchange(URI.create(url), HttpMethod.GET, new HttpEntity<>(h), String.class);
                result.put("success", true);
                result.put("message", "Jenkins job " + s.getJobName() + " is reachable.");
            }
        } catch (HttpStatusCodeException e) {
            result.put("success", false);
            result.put("message", "Remote returned HTTP " + e.getStatusCode().value());
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Connection failed: " + e.getClass().getSimpleName());
        }
        return result;
    }

    private PipelineSourceResponse toResponse(PipelineSource s) {
        LocalDateTime last = pipelineRunRepository.findFirstBySource_IdOrderByCreatedAtDesc(s.getId())
                .map(r -> r.getCreatedAt()).orElse(null);
        return PipelineSourceResponse.from(s, last);
    }

    private void apply(PipelineSource s, PipelineSourceRequest req, boolean creating) {
        if (!notBlank(req.getName())) throw new IllegalArgumentException("Name is required");
        s.setName(req.getName().trim());

        if (PipelineSource.GITHUB_ACTIONS.equals(s.getProvider())) {
            String repo = req.getRepoFullName() == null ? "" : req.getRepoFullName().trim();
            if (!REPO_PATTERN.matcher(repo).matches()) throw new IllegalArgumentException("Repository must be in owner/repo format");
            s.setRepoFullName(repo);
            if (notBlank(req.getAccessToken())) s.setAccessToken(req.getAccessToken().trim());
        } else {
            String base = req.getBaseUrl() == null ? "" : req.getBaseUrl().trim();
            if (!base.matches("^https?://[^\\s/]+.*$")) throw new IllegalArgumentException("Base URL must start with http:// or https://");
            if (!notBlank(req.getJobName())) throw new IllegalArgumentException("Job name is required");
            if (creating && !notBlank(req.getUsername())) throw new IllegalArgumentException("Username is required");
            if (creating && !notBlank(req.getApiToken())) throw new IllegalArgumentException("API token is required");
            s.setBaseUrl(base);
            s.setJobName(req.getJobName().trim());
            if (notBlank(req.getUsername())) s.setUsername(req.getUsername().trim());
            if (notBlank(req.getApiToken())) s.setApiToken(req.getApiToken().trim());
        }

        if (req.getProjectId() != null) {
            if (!projectRepository.existsById(req.getProjectId())) throw new IllegalArgumentException("Linked project not found");
            s.setProjectId(req.getProjectId());
        } else if (!creating) {
            s.setProjectId(null);
        }
    }

    private static String normalizeProvider(String p) {
        if (p != null && (p.equalsIgnoreCase(PipelineSource.GITHUB_ACTIONS) || p.equalsIgnoreCase(PipelineSource.JENKINS))) {
            return p.toUpperCase();
        }
        throw new IllegalArgumentException("Provider must be GITHUB_ACTIONS or JENKINS");
    }

    static String generateSecret() {
        byte[] b = new byte[32];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private static boolean notBlank(String v) {
        return v != null && !v.isBlank();
    }
}
