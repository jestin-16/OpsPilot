package com.opspilot.repository;

import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The queries behind webhook attribution and the admin overview, run against a real (in-memory) database. */
@SpringBootTest(properties = {
        "app.jwt.secret=integration-test-secret-longer-than-32-bytes",
        "spring.datasource.url=jdbc:h2:mem:project-matching;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "eureka.client.enabled=false"
})
@Transactional
class ProjectRepositoryMatchingTest {

    @Autowired
    private ProjectRepository projects;

    @Autowired
    private UserRepository users;

    private User owner;

    @BeforeEach
    void setUp() {
        owner = users.save(new User("Owner", "owner-" + System.nanoTime() + "@example.com", "hash", Set.of()));
    }

    private Project project(String name, String repositoryUrl, String githubRepo) {
        Project project = new Project(name, "", repositoryUrl, owner, "Active");
        project.setEnvironment("dev");
        project.setGithubRepoName(githubRepo);
        return projects.save(project);
    }

    private List<String> matches(String repoName) {
        return projects.findByRepositoryName(repoName).stream().map(Project::getProjectName).toList();
    }

    @Test
    void matchesTheRepositoryExactlyNotBySubstring() {
        project("Payments Gateway", "https://github.com/acme/payment-api-gateway", null);
        project("Core API", "https://github.com/acme/api.git", null);

        assertEquals(List.of("Core API"), matches("api"));
        assertEquals(List.of("Payments Gateway"), matches("payment-api-gateway"));
    }

    @Test
    void matchesByGithubRepoNameOrProjectName() {
        project("Invoices", null, "acme/billing-service");
        project("Notes App", null, null);

        assertEquals(List.of("Invoices"), matches("billing-service"));
        assertEquals(List.of("Notes App"), matches("notes-app"));
        assertTrue(matches("billing").isEmpty(), "a prefix is not a match");
    }

    @Test
    void countsActiveUsersInTheDatabase() {
        long before = users.countActive();
        User inactive = new User("Gone", "gone-" + System.nanoTime() + "@example.com", "hash", Set.of());
        inactive.setIsActive(false);
        users.save(inactive);
        users.save(new User("Here", "here-" + System.nanoTime() + "@example.com", "hash", Set.of()));

        assertEquals(before + 1, users.countActive());
    }
}
