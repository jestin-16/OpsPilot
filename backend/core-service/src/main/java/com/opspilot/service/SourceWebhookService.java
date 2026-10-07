package com.opspilot.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.entity.PipelineRunEntity;
import com.opspilot.entity.PipelineSource;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.exception.UnauthorizedException;
import com.opspilot.repository.PipelineSourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;

/** Handles per-source webhooks. Authentication is the HMAC signature / shared token, not JWT. */
@Service
public class SourceWebhookService {

    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    private PipelineSourceRepository sourceRepository;

    @Autowired
    private CiCdService ciCdService;

    /** Loads the source for a provider path segment; unknown/mismatched -> 404, disabled -> 403. Never auto-creates. */
    public PipelineSource resolveSource(String providerSegment, Long sourceId) {
        PipelineSource source = sourceRepository.findById(sourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Unknown pipeline source"));
        String expected = PipelineSource.GITHUB_ACTIONS.equals(source.getProvider()) ? "github" : "jenkins";
        if (!expected.equalsIgnoreCase(providerSegment)) {
            throw new ResourceNotFoundException("Unknown pipeline source");
        }
        if (!source.isEnabled()) {
            throw new ForbiddenException("Pipeline source is disabled");
        }
        return source;
    }

    public Map<String, Object> handleGithub(PipelineSource source, String event, String signature, byte[] rawBody) {
        if (!verifyGithubSignature(source.getWebhookSecret(), rawBody, signature)) {
            throw new UnauthorizedException("Invalid signature");
        }
        Map<String, Object> response = new HashMap<>();
        if (!"workflow_run".equals(event)) {
            response.put("message", "Event ignored: " + event);
            return response;
        }

        Map<String, Object> payload = parse(rawBody);
        if (!(payload.get("workflow_run") instanceof Map<?, ?> wr)) {
            throw new IllegalArgumentException("Invalid payload: missing workflow_run");
        }

        String branch = str(wr.get("head_branch"), "main");
        String sha = str(wr.get("head_sha"), "");
        String message = "Workflow run";
        String author = "GitHub Actions";
        if (wr.get("head_commit") instanceof Map<?, ?> hc) {
            message = str(hc.get("message"), message);
            if (hc.get("author") instanceof Map<?, ?> a) author = str(a.get("name"), author);
        }
        String ghStatus = str(wr.get("status"), "queued");
        String conclusion = wr.get("conclusion") != null ? wr.get("conclusion").toString() : null;
        String finalStatus = "IN_PROGRESS";
        if ("completed".equals(ghStatus)) {
            finalStatus = "success".equals(conclusion) ? "SUCCESS" : "FAILED";
        }
        String htmlUrl = wr.get("html_url") != null ? wr.get("html_url").toString() : null;
        String logs = htmlUrl != null ? "Logs available at: " + htmlUrl : "No logs URL provided";
        String externalId = wr.get("id") != null ? wr.get("id").toString() : null;

        String repoFull = source.getRepoFullName();
        String repoUrl = "https://github.com/" + repoFull;

        PipelineRunEntity run = ciCdService.trackSourceRun(source, "workflow_run", branch, sha, message, author,
                finalStatus, logs, null, externalId, repoUrl);

        if ("completed".equals(ghStatus) && externalId != null && externalId.matches("\\d+") && repoFull != null && repoFull.contains("/")) {
            String[] parts = repoFull.split("/", 2);
            ciCdService.fetchAndSaveGitHubLogsAsync(run.getRunId(), parts[0], parts[1], Long.parseLong(externalId), source.getAccessToken());
        }

        response.put("message", "Workflow run tracked successfully");
        response.put("runId", run.getRunId());
        response.put("status", run.getStatus());
        return response;
    }

    public Map<String, Object> handleJenkins(PipelineSource source, String token, byte[] rawBody) {
        if (token == null || !constantTimeEquals(source.getWebhookSecret(), token)) {
            throw new UnauthorizedException("Invalid token");
        }
        Map<String, Object> payload = parse(rawBody);
        Map<String, Object> response = new HashMap<>();
        if (!(payload.get("build") instanceof Map<?, ?> build)) {
            throw new IllegalArgumentException("Invalid Jenkins payload: missing build object");
        }

        String phase = str(build.get("phase"), "").toUpperCase();
        String status = build.get("status") != null ? build.get("status").toString().toUpperCase() : null;
        String buildUrl = build.get("full_url") != null ? build.get("full_url").toString() : null;
        String number = str(build.get("number"), "?");

        if ("FINALIZED".equals(phase)) {
            response.put("message", "FINALIZED phase ignored, build already tracked on COMPLETED");
            return response;
        }

        String repoUrl = buildUrl != null ? buildUrl : source.getBaseUrl();
        String branch = "main";
        String commit = null;
        if (build.get("scm") instanceof Map<?, ?> scm) {
            repoUrl = str(scm.get("url"), repoUrl);
            branch = str(scm.get("branch"), branch);
            commit = scm.get("commit") != null ? scm.get("commit").toString() : null;
        }

        boolean completed = "COMPLETED".equals(phase);
        String finalStatus = "IN_PROGRESS";
        if (completed) finalStatus = "SUCCESS".equals(status) ? "SUCCESS" : "FAILED";
        String logs = buildUrl != null
                ? "Logs available at: " + (buildUrl.endsWith("/") ? buildUrl : buildUrl + "/") + "console"
                : "No build URL provided";

        PipelineRunEntity run = ciCdService.trackSourceRun(source, "jenkins_build", branch, commit,
                "Jenkins build #" + number, "Jenkins", finalStatus, logs, null, buildUrl, repoUrl);

        if (completed && buildUrl != null) {
            ciCdService.fetchAndSaveJenkinsLogsAsync(run.getRunId(), buildUrl, source.getUsername(), source.getApiToken());
        }

        response.put("message", "Jenkins build tracked successfully");
        response.put("runId", run.getRunId());
        response.put("status", run.getStatus());
        return response;
    }

    /** HMAC-SHA256 of the raw body, compared in constant time against the X-Hub-Signature-256 header. */
    public static boolean verifyGithubSignature(String secret, byte[] body, String signatureHeader) {
        if (secret == null || signatureHeader == null || !signatureHeader.startsWith("sha256=")) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] expected = mac.doFinal(body);
            byte[] provided = hexToBytes(signatureHeader.substring("sha256=".length()));
            return provided != null && MessageDigest.isEqual(expected, provided);
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }

    private static byte[] hexToBytes(String hex) {
        if (hex.length() % 2 != 0) return null;
        byte[] out = new byte[hex.length() / 2];
        for (int i = 0; i < out.length; i++) {
            int hi = Character.digit(hex.charAt(2 * i), 16);
            int lo = Character.digit(hex.charAt(2 * i + 1), 16);
            if (hi < 0 || lo < 0) return null;
            out[i] = (byte) ((hi << 4) | lo);
        }
        return out;
    }

    private Map<String, Object> parse(byte[] raw) {
        try {
            return mapper.readValue(raw, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid JSON payload");
        }
    }

    private static String str(Object v, String def) {
        return v != null ? v.toString() : def;
    }
}
