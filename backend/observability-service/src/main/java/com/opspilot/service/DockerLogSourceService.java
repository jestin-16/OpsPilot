package com.opspilot.service;

import com.opspilot.dto.DockerLogSourceRequest;
import com.opspilot.dto.DockerLogSourceResponse;
import com.opspilot.entity.DockerLogSource;
import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.DockerLogSourceRepository;
import com.opspilot.repository.ProjectRepository;
import com.opspilot.security.ingest.IngestTokenService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

/** CRUD for push-model Docker sources. Access follows projects: administrators see all, others only projects they own. */
@Service
public class DockerLogSourceService {

    private static final Pattern ENVIRONMENT = Pattern.compile("^[a-z0-9][a-z0-9_-]{0,31}$");

    private final DockerLogSourceRepository repository;
    private final ProjectRepository projectRepository;
    private final IngestTokenService tokenService;
    private final DockerSourceStatusService statusService;

    public DockerLogSourceService(DockerLogSourceRepository repository, ProjectRepository projectRepository,
                                  IngestTokenService tokenService, DockerSourceStatusService statusService) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.tokenService = tokenService;
        this.statusService = statusService;
    }

    public List<DockerLogSourceResponse> list(User user) {
        List<DockerLogSource> sources;
        if (isAdmin(user)) {
            sources = repository.findAllByOrderByCreatedAtDesc();
        } else {
            List<Long> ids = projectRepository.findByOwner(user).stream().map(Project::getId).toList();
            sources = ids.isEmpty() ? List.of() : repository.findByProjectIdInOrderByCreatedAtDesc(ids);
        }
        return sources.stream().map(this::toResponse).toList();
    }

    public DockerLogSourceResponse get(UUID id, User user) {
        return toResponse(findAccessible(id, user));
    }

    public DockerLogSourceResponse create(DockerLogSourceRequest req, User user) {
        if (req.getProjectId() == null) throw new IllegalArgumentException("Project is required");
        assertProjectAccess(req.getProjectId(), user);
        DockerLogSource s = new DockerLogSource();
        s.setProjectId(req.getProjectId());
        s.setName(validName(req.getName()));
        s.setEnvironment(validEnvironment(req.getEnvironment()));
        String token = tokenService.generate();
        s.setTokenHash(tokenService.hash(token));
        s.setTokenPrefix(tokenService.displayPrefix(token));
        return toResponse(repository.save(s)).withToken(token);
    }

    public DockerLogSourceResponse update(UUID id, DockerLogSourceRequest req, User user) {
        DockerLogSource s = findAccessible(id, user);
        s.setName(validName(req.getName()));
        s.setEnvironment(validEnvironment(req.getEnvironment()));
        return toResponse(repository.save(s));
    }

    public void delete(UUID id, User user) {
        repository.delete(findAccessible(id, user));
    }

    /** Replaces the token; the old one stops working immediately. The new raw token is returned exactly once. */
    public DockerLogSourceResponse rotateToken(UUID id, User user) {
        DockerLogSource s = findAccessible(id, user);
        String token = tokenService.generate();
        s.setTokenHash(tokenService.hash(token));
        s.setTokenPrefix(tokenService.displayPrefix(token));
        s.setLastSeenAt(null);
        s.setStatus(DockerLogSource.WAITING);
        return toResponse(repository.save(s)).withToken(token);
    }

    private DockerLogSource findAccessible(UUID id, User user) {
        DockerLogSource s = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Log source not found with id: " + id));
        assertProjectAccess(s.getProjectId(), user);
        return s;
    }

    private void assertProjectAccess(Long projectId, User user) {
        if (user == null) throw new ForbiddenException("Authentication is required");
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Linked project not found"));
        if (!isAdmin(user) && !project.getOwner().getId().equals(user.getId())) {
            throw new ForbiddenException("Only the project owner or an Administrator can manage this log source");
        }
    }

    private DockerLogSourceResponse toResponse(DockerLogSource s) {
        return DockerLogSourceResponse.from(s, statusService.getStaleAfter(), LocalDateTime.now());
    }

    static String validName(String name) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Name is required");
        String n = name.trim();
        if (n.length() > 100) throw new IllegalArgumentException("Name must be at most 100 characters");
        return n;
    }

    static String validEnvironment(String env) {
        String e = env == null ? "" : env.trim().toLowerCase();
        if (!ENVIRONMENT.matcher(e).matches()) {
            throw new IllegalArgumentException("Environment must be 1-32 chars of a-z, 0-9, '-' or '_'");
        }
        return e;
    }

    static boolean isAdmin(User user) {
        return user != null && user.getRoles().stream()
                .anyMatch(r -> r.getRoleName().equalsIgnoreCase("ADMIN") || r.getRoleName().equalsIgnoreCase("ROLE_ADMIN"));
    }
}
