package com.opspilot.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class WebhookPayload {

    private String ref;
    
    @JsonProperty("repository")
    private RepositoryInfo repository;
    
    @JsonProperty("head_commit")
    private CommitInfo headCommit;
    
    private String action; // for workflow_run or PR

    public String getRef() {
        return ref;
    }

    public void setRef(String ref) {
        this.ref = ref;
    }

    public RepositoryInfo getRepository() {
        return repository;
    }

    public void setRepository(RepositoryInfo repository) {
        this.repository = repository;
    }

    public CommitInfo getHeadCommit() {
        return headCommit;
    }

    public void setHeadCommit(CommitInfo headCommit) {
        this.headCommit = headCommit;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RepositoryInfo {
        private String name;
        @JsonProperty("html_url")
        private String htmlUrl;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getHtmlUrl() {
            return htmlUrl;
        }

        public void setHtmlUrl(String htmlUrl) {
            this.htmlUrl = htmlUrl;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CommitInfo {
        private String id;
        private String message;
        private AuthorInfo author;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public AuthorInfo getAuthor() {
            return author;
        }

        public void setAuthor(AuthorInfo author) {
            this.author = author;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AuthorInfo {
        private String name;
        private String email;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }
}
