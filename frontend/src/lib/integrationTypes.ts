import { Cpu, FileText, GitBranch, Server, Workflow, type LucideIcon } from 'lucide-react';
import type { IntegrationType } from '../services/projectApi';
import { DNS_LABEL_PATTERN, DNS_SUBDOMAIN_PATTERN, REPOSITORY_PATTERN, isEndpointUrl } from './formValidation';

export type FieldKind = 'text' | 'password' | 'textarea' | 'checkbox' | 'select' | 'number';

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  /** Stored encrypted and never shown again; sent in `secrets`, not `config`. */
  secret?: boolean;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: Array<{ value: string; label: string }>;
  /** Only show/require this field when another field has one of these values. */
  showIf?: { key: string; values: string[] };
  defaultValue?: string;
}

export interface IntegrationTypeDef {
  type: IntegrationType;
  label: string;
  description: string;
  category: string;
  /** Tailwind color family used for badges. */
  color: 'sky' | 'indigo' | 'slate' | 'emerald' | 'amber';
  fields: FieldDef[];
}

export const INTEGRATION_TYPES: IntegrationTypeDef[] = [
  {
    type: 'DOCKER',
    label: 'Docker',
    description: 'Follow container logs from a Docker Engine API endpoint.',
    category: 'CONTAINER',
    color: 'sky',
    fields: [
      { key: 'host', label: 'Docker host', kind: 'text', required: true, placeholder: 'http://10.0.0.5:2375', help: 'TCP endpoint of the Docker Engine API. Unix sockets are not supported; use a TCP socket proxy.' },
      { key: 'containers', label: 'Containers', kind: 'text', placeholder: 'web, worker', help: 'Comma-separated names or ids. Leave empty to follow every running container.' },
      { key: 'caCert', label: 'CA certificate (PEM)', kind: 'textarea', secret: true, help: 'Only for HTTPS endpoints with a private CA.' },
      { key: 'insecureSkipTlsVerify', label: 'Skip TLS verification (not recommended)', kind: 'checkbox' },
    ],
  },
  {
    type: 'KUBERNETES',
    label: 'Kubernetes',
    description: 'Stream pod logs from a cluster namespace.',
    category: 'KUBERNETES',
    color: 'indigo',
    fields: [
      { key: 'apiServer', label: 'API server URL', kind: 'text', required: true, placeholder: 'https://10.0.0.1:6443', help: 'For a cluster on the machine running the Docker Compose stack (k3s, Docker Desktop), use https://kubernetes:6443; 127.0.0.1 would mean the OpsPilot container itself.' },
      { key: 'token', label: 'Service-account token', kind: 'password', secret: true, required: true, help: 'Needs get/list on pods and get on pods/log.' },
      { key: 'namespace', label: 'Namespace', kind: 'text', defaultValue: 'default' },
      { key: 'podName', label: 'Pods', kind: 'text', placeholder: 'api-7d9f, worker-1', help: 'Comma-separated. Empty = all pods matching the label selector.' },
      { key: 'labelSelector', label: 'Label selector', kind: 'text', placeholder: 'app=shop' },
      { key: 'container', label: 'Container', kind: 'text', help: 'Empty = every container in each pod.' },
      { key: 'caCert', label: 'Cluster CA (PEM)', kind: 'textarea', secret: true },
      { key: 'insecureSkipTlsVerify', label: 'Skip TLS verification (not recommended)', kind: 'checkbox' },
    ],
  },
  {
    type: 'GITHUB',
    label: 'Git',
    description: 'Push, pull-request and workflow events from a GitHub repository.',
    category: 'SOURCE_CONTROL',
    color: 'slate',
    fields: [
      { key: 'repo', label: 'Repository', kind: 'text', required: true, placeholder: 'owner/name' },
      { key: 'token', label: 'Access token', kind: 'password', secret: true, help: 'Required for private repositories.' },
      { key: 'webhookSecret', label: 'Webhook secret', kind: 'password', secret: true, help: 'Set the same secret on the GitHub webhook to receive events instantly instead of polling.' },
      { key: 'apiBaseUrl', label: 'API base URL', kind: 'text', placeholder: 'https://github.example.com/api/v3', help: 'GitHub Enterprise only.' },
      { key: 'pollSeconds', label: 'Poll interval (seconds)', kind: 'number', defaultValue: '30' },
    ],
  },
  {
    type: 'CICD',
    label: 'CI/CD',
    description: 'Pipeline, build and job activity from GitHub Actions or Jenkins.',
    category: 'CICD',
    color: 'amber',
    fields: [
      {
        key: 'provider', label: 'Provider', kind: 'select', required: true, defaultValue: 'GITHUB_ACTIONS',
        options: [{ value: 'GITHUB_ACTIONS', label: 'GitHub Actions' }, { value: 'JENKINS', label: 'Jenkins' }],
      },
      { key: 'repo', label: 'Repository', kind: 'text', required: true, placeholder: 'owner/name', showIf: { key: 'provider', values: ['GITHUB_ACTIONS'] } },
      { key: 'token', label: 'Access token', kind: 'password', secret: true, showIf: { key: 'provider', values: ['GITHUB_ACTIONS'] } },
      { key: 'baseUrl', label: 'Jenkins URL', kind: 'text', required: true, placeholder: 'https://jenkins.example.com', showIf: { key: 'provider', values: ['JENKINS'] } },
      { key: 'job', label: 'Job name', kind: 'text', required: true, showIf: { key: 'provider', values: ['JENKINS'] } },
      { key: 'username', label: 'Username', kind: 'text', secret: true, showIf: { key: 'provider', values: ['JENKINS'] } },
      { key: 'apiToken', label: 'API token', kind: 'password', secret: true, showIf: { key: 'provider', values: ['JENKINS'] } },
      { key: 'pollSeconds', label: 'Poll interval (seconds)', kind: 'number', defaultValue: '30' },
    ],
  },
  {
    type: 'APP_LOGS',
    label: 'App Logs',
    description: 'Logs shipped from your application over HTTP, for example a service running on AWS.',
    category: 'APPLICATION',
    color: 'emerald',
    fields: [
      { key: 'app', label: 'Application label', kind: 'text', placeholder: 'django-demo', help: 'Shown on log lines from this source.' },
    ],
  },
];

export const TYPE_BY_KEY: Record<string, IntegrationTypeDef> = Object.fromEntries(INTEGRATION_TYPES.map((t) => [t.type, t]));

export const TYPE_ICONS: Record<IntegrationType, LucideIcon> = {
  DOCKER: Server,
  KUBERNETES: Cpu,
  GITHUB: GitBranch,
  CICD: Workflow,
  APP_LOGS: FileText,
};

export const BADGE_COLORS: Record<IntegrationTypeDef['color'], string> = {
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-300',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function isVisible(field: FieldDef, values: Record<string, string>): boolean {
  return !field.showIf || field.showIf.values.includes(values[field.showIf.key] ?? '');
}

/** Splits form values into the `config` and `secrets` payloads; blank secrets are omitted so stored ones are kept. */
export function toPayload(def: IntegrationTypeDef, values: Record<string, string>) {
  const config: Record<string, unknown> = {};
  const secrets: Record<string, string> = {};
  for (const f of def.fields) {
    if (!isVisible(f, values)) continue;
    const v = (values[f.key] ?? '').trim();
    if (f.secret) {
      if (v) secrets[f.key] = values[f.key];
    } else if (f.kind === 'checkbox') {
      if (values[f.key] === 'true') config[f.key] = 'true';
    } else if (v) {
      config[f.key] = v;
    }
  }
  return { config, secrets };
}

/** Returns the first problem with the form, or null. In edit mode a stored secret counts as present. */
export function validateFields(def: IntegrationTypeDef, values: Record<string, string>, storedSecrets: string[] = []): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of def.fields) {
    if (!isVisible(f, values)) continue;
    const value = (values[f.key] ?? '').trim();
    const has = value !== '' || (f.secret && storedSecrets.includes(f.key));
    if (f.required && !has) { errors[f.key] = `${f.label} is required`; continue; }
    if (!value) continue;
    const max = f.secret ? 65536 : 2048;
    if (value.length > max) { errors[f.key] = `${f.label} must be ${max} characters or fewer`; continue; }
    const singleLine = f.kind === 'textarea' ? value.replace(/[\r\n\t]/g, '') : value;
    if (/[\p{Cc}]/u.test(singleLine)) { errors[f.key] = `${f.label} must not contain control characters`; continue; }
    if (f.kind === 'select' && !f.options?.some(option => option.value === value)) errors[f.key] = `Choose a valid ${f.label.toLowerCase()}`;
    if (f.kind === 'checkbox' && value !== 'true' && value !== 'false') errors[f.key] = `${f.label} must be a checkbox value`;
    if (f.kind === 'number' && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 5 || Number(value) > 86400)) errors[f.key] = `${f.label} must be a whole number between 5 and 86400`;
    if (['host', 'apiServer', 'baseUrl', 'apiBaseUrl'].includes(f.key)) {
      const protocols = f.key === 'host' ? ['http:', 'https:', 'tcp:'] : ['http:', 'https:'];
      if (!isEndpointUrl(value, protocols)) errors[f.key] = `${f.label} must be a valid ${f.key === 'host' ? 'http://, https:// or tcp://' : 'http:// or https://'} URL`;
    }
    if (f.key === 'repo' && (!REPOSITORY_PATTERN.test(value) || value.split('/')[0].length > 39 || value.split('/')[1].length > 100)) errors[f.key] = 'Repository must look like owner/name';
    if (['namespace', 'container'].includes(f.key) && (value.length > 63 || !DNS_LABEL_PATTERN.test(value))) errors[f.key] = `${f.label} must use lowercase letters, numbers or hyphens, start and end with a letter or number, and be 63 characters or fewer`;
    if (f.key === 'podName' && value.split(',').some(pod => pod.trim().length > 253 || !DNS_SUBDOMAIN_PATTERN.test(pod.trim()) || pod.trim().split('.').some(label => !DNS_LABEL_PATTERN.test(label) || label.length > 63))) errors[f.key] = 'Use comma-separated valid pod names';
    if (f.key === 'containers' && value.split(',').some(container => !/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(container.trim()))) errors[f.key] = 'Use comma-separated container names or IDs';
    if (f.key === 'caCert' && !/^(?:-----BEGIN CERTIFICATE-----\s+[A-Za-z0-9+/=\r\n]+\s+-----END CERTIFICATE-----\s*)+$/.test(value)) errors[f.key] = `${f.label} must contain a PEM certificate`;
  }
  return errors;
}

/** First error for callers that use a form-level message. */
export function validate(def: IntegrationTypeDef, values: Record<string, string>, storedSecrets: string[] = []): string | null {
  return Object.values(validateFields(def, values, storedSecrets))[0] ?? null;
}

export function initialValues(def: IntegrationTypeDef, config: Record<string, unknown> = {}): Record<string, string> {
  const values: Record<string, string> = {};
  for (const f of def.fields) {
    if (f.secret) {
      values[f.key] = '';
    } else {
      const existing = config[f.key];
      values[f.key] = existing != null ? String(existing) : f.defaultValue ?? '';
    }
  }
  return values;
}
