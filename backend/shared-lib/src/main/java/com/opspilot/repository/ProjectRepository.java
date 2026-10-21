package com.opspilot.repository;

import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwner(User owner);

    @org.springframework.data.jpa.repository.Query("SELECT p.id FROM Project p WHERE p.owner = :owner")
    List<Long> findIdsByOwner(@org.springframework.data.repository.query.Param("owner") User owner);

    /**
     * Projects whose repository is exactly the named one (lower-case name): the URL ends in /name or
     * /name.git, the GitHub repo is name or owner/name, or the hyphenated project name equals it.
     */
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Project p WHERE " +
            "LOWER(p.repositoryUrl) LIKE CONCAT('%/', :name) OR LOWER(p.repositoryUrl) LIKE CONCAT('%/', :name, '.git') OR " +
            "LOWER(p.githubRepoName) = :name OR LOWER(p.githubRepoName) LIKE CONCAT('%/', :name) OR " +
            "LOWER(REPLACE(p.projectName, ' ', '-')) = :name ORDER BY p.id")
    List<Project> findByRepositoryName(@org.springframework.data.repository.query.Param("name") String name);
    Page<Project> findByOwner(User owner, Pageable pageable);
    List<Project> findByRepositoryUrl(String repositoryUrl);
    boolean existsBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, Long id);
    boolean existsByProjectNameAndOwner(String projectName, User owner);
    boolean existsByProjectNameIgnoreCaseAndOwner(String projectName, User owner);
}
