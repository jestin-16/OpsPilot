import { describe, expect, it } from 'vitest';
import { INTEGRATION_TYPES, TYPE_BY_KEY, initialValues, isVisible, toPayload, validate } from './integrationTypes';

const def = (t: string) => TYPE_BY_KEY[t];

describe('integration type definitions', () => {
  it('covers the five integration types', () => {
    expect(INTEGRATION_TYPES.map((t) => t.type)).toEqual(['DOCKER', 'KUBERNETES', 'GITHUB', 'CICD', 'APP_LOGS']);
  });

  it('never marks a non-secret field with a secret-looking key (the server would move it)', () => {
    for (const t of INTEGRATION_TYPES) {
      for (const f of t.fields) {
        if (!f.secret) expect(f.key).not.toMatch(/token|secret|password|username|cert/i);
      }
    }
  });
});

describe('toPayload', () => {
  it('sends secrets separately and drops blank ones so stored values are kept', () => {
    const values = { ...initialValues(def('KUBERNETES')), apiServer: 'https://k:6443', token: 's3', caCert: '', namespace: 'prod' };
    const { config, secrets } = toPayload(def('KUBERNETES'), values);
    expect(config).toEqual({ apiServer: 'https://k:6443', namespace: 'prod' });
    expect(secrets).toEqual({ token: 's3' });
  });

  it('only sends fields that apply to the chosen CI provider', () => {
    const jenkins = { ...initialValues(def('CICD')), provider: 'JENKINS', baseUrl: 'https://j', job: 'deploy', username: 'u', apiToken: 't', repo: 'ignored/x', token: 'ignored' };
    const { config, secrets } = toPayload(def('CICD'), jenkins);
    expect(config).toMatchObject({ provider: 'JENKINS', baseUrl: 'https://j', job: 'deploy' });
    expect(config).not.toHaveProperty('repo');
    expect(secrets).toEqual({ username: 'u', apiToken: 't' });
  });

  it('serializes a ticked checkbox and omits an unticked one', () => {
    const base = { ...initialValues(def('DOCKER')), host: 'http://d:2375' };
    expect(toPayload(def('DOCKER'), { ...base, insecureSkipTlsVerify: 'true' }).config).toHaveProperty('insecureSkipTlsVerify', 'true');
    expect(toPayload(def('DOCKER'), base).config).not.toHaveProperty('insecureSkipTlsVerify');
  });
});

describe('validate', () => {
  it('requires the required fields', () => {
    expect(validate(def('DOCKER'), initialValues(def('DOCKER')))).toMatch(/host/i);
  });

  it('accepts a stored secret as satisfying a required secret when editing', () => {
    const values = { ...initialValues(def('KUBERNETES')), apiServer: 'https://k:6443' };
    expect(validate(def('KUBERNETES'), values)).toMatch(/token/i);
    expect(validate(def('KUBERNETES'), values, ['token'])).toBeNull();
  });

  it('checks the repository format and URL scheme', () => {
    expect(validate(def('GITHUB'), { ...initialValues(def('GITHUB')), repo: 'not a repo' })).toMatch(/owner\/name/);
    expect(validate(def('GITHUB'), { ...initialValues(def('GITHUB')), repo: 'acme/shop' })).toBeNull();
    expect(validate(def('DOCKER'), { ...initialValues(def('DOCKER')), host: 'ftp://x' })).toMatch(/http/);
    expect(validate(def('DOCKER'), { ...initialValues(def('DOCKER')), host: 'tcp://10.0.0.5:2375' })).toBeNull();
  });

  it('skips fields hidden by the provider choice', () => {
    const gh = { ...initialValues(def('CICD')), provider: 'GITHUB_ACTIONS', repo: 'acme/shop' };
    expect(validate(def('CICD'), gh)).toBeNull(); // Jenkins baseUrl/job are not required here
    expect(isVisible(def('CICD').fields.find((f) => f.key === 'job')!, gh)).toBe(false);
  });

  it('APP_LOGS needs nothing but a name', () => {
    expect(validate(def('APP_LOGS'), initialValues(def('APP_LOGS')))).toBeNull();
  });
});

describe('initialValues', () => {
  it('never prefills secrets, even if present in the data', () => {
    const v = initialValues(def('GITHUB'), { repo: 'a/b', token: 'leak', pollSeconds: 10 });
    expect(v.repo).toBe('a/b');
    expect(v.token).toBe('');
    expect(v.pollSeconds).toBe('10');
  });
});
