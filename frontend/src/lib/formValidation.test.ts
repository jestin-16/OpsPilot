import { describe, expect, it } from 'vitest';
import { AdminIntegrationSchema, DeploymentFormSchema, DockerSourceFormSchema, IncidentFormSchema, JsonObjectSchema, NameSchema, ProjectFieldsSchema, ProfileSchema, RepositoryUrlSchema, UserFormSchema, isEndpointUrl } from './formValidation';

describe('shared form validation', () => {
  it.each(['Alice123', '<script>Alice</script>', 'Alice@example.com', 'Alice\nSmith', '\u0301'])('rejects invalid person names %j', name => {
    expect(NameSchema.safeParse(name).success).toBe(false);
  });

  it('validates every project field and trims submitted text', () => {
    expect(ProjectFieldsSchema.parse({ projectName: ' Shop API ', environment: 'dev', description: ' Service\nnotes ', repositoryUrl: ' https://github.com/acme/shop ' })).toEqual({
      projectName: 'Shop API', environment: 'dev', description: 'Service\nnotes', repositoryUrl: 'https://github.com/acme/shop',
    });
    for (const invalid of [{ projectName: '  ' }, { projectName: '<Project>' }, { environment: 'other' }, { description: 'x'.repeat(1001) }, { description: 'Notes\u0000' }]) {
      expect(ProjectFieldsSchema.safeParse({ projectName: 'Shop API', ...invalid }).success).toBe(false);
    }
  });

  it.each(['https://github.com', 'https://github.com/owner', 'https://github.com.evil.test/a/b', 'https://user:secret@github.com/a/b', 'javascript:alert(1)', 'https://github.com/a/b#fragment', 'https://github.com/a b/c'])('rejects invalid repository URL %j', url => {
    expect(RepositoryUrlSchema.safeParse(url).success).toBe(false);
  });

  it.each(['', 'https://github.com/acme/shop.git', 'https://gitlab.com/group/subgroup/shop'])('accepts optional and valid repository URLs %j', url => {
    expect(RepositoryUrlSchema.safeParse(url).success).toBe(true);
  });

  it.each(['http://', 'http:///host', 'https://:443', 'http://host:99999', 'http://host:0', 'https://user:pass@host', 'https://host\\path', 'https://host/with space', 'ftp://host'])('rejects malformed endpoint %j', url => {
    expect(isEndpointUrl(url)).toBe(false);
  });

  it('allows internal endpoints and only allows TCP when requested', () => {
    expect(isEndpointUrl('http://docker:2375')).toBe(true);
    expect(isEndpointUrl('https://[::1]:6443')).toBe(true);
    expect(isEndpointUrl('tcp://docker:2375')).toBe(false);
    expect(isEndpointUrl('tcp://docker:2375', ['http:', 'https:', 'tcp:'])).toBe(true);
  });

  it.each(['null', '[]', '42', '"string"', '{invalid}', '{"a":1} trailing'])('requires JSON objects %j', configJson => {
    expect(JsonObjectSchema.safeParse(configJson).success).toBe(false);
    expect(AdminIntegrationSchema.safeParse({ name: 'GitHub', providerType: 'GITHUB', configJson, active: true }).success).toBe(false);
  });

  it('accepts optional JSON and nested object values', () => {
    expect(JsonObjectSchema.safeParse('').success).toBe(true);
    expect(JsonObjectSchema.safeParse('{"options":{"enabled":true},"items":[]}').success).toBe(true);
  });

  it('validates profile email and user roles', () => {
    expect(ProfileSchema.safeParse({ name: 'Alice', email: 'alice@' }).success).toBe(false);
    expect(UserFormSchema.safeParse({ name: 'Alice', email: 'alice@example.com', role: 'ROOT' }).success).toBe(false);
    expect(UserFormSchema.safeParse({ name: 'Alice', email: 'alice@example.com', role: 'ADMIN' }).success).toBe(true);
  });

  it.each(['', '   ', 'v1 beta', '<release>', 'a'.repeat(101)])('rejects invalid deployment tags %j', version => {
    expect(DeploymentFormSchema.safeParse({ version, environment: 'Production', status: 'Succeeded' }).success).toBe(false);
  });

  it('accepts release tags and rejects unknown deployment selections', () => {
    expect(DeploymentFormSchema.safeParse({ version: 'v1.0.0-rc.1+build.5', environment: 'Staging', status: 'In progress' }).success).toBe(true);
    expect(DeploymentFormSchema.safeParse({ version: 'v1', environment: 'Other', status: 'Unknown' }).success).toBe(false);
  });

  it('requires incident project, title and severity and bounds optional fields', () => {
    const incident = { projectId: 1, title: 'API latency > 1s', description: '', severity: 'HIGH', affectedService: 'api' };
    expect(IncidentFormSchema.safeParse(incident).success).toBe(true);
    for (const invalid of [{ projectId: -1 }, { projectId: 1.5 }, { title: ' ' }, { severity: 'OTHER' }, { description: 'x'.repeat(5001) }, { affectedService: 'api\nworker' }]) {
      expect(IncidentFormSchema.safeParse({ ...incident, ...invalid }).success).toBe(false);
    }
  });

  it('requires a valid host name, project and environment for log sources', () => {
    const source = { name: 'prod-db-01', projectId: 1, environment: 'production' };
    expect(DockerSourceFormSchema.safeParse(source).success).toBe(true);
    for (const invalid of [{ name: '<host>' }, { projectId: 0 }, { projectId: NaN }, { environment: 'other' }]) {
      expect(DockerSourceFormSchema.safeParse({ ...source, ...invalid }).success).toBe(false);
    }
  });
});
