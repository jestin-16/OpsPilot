import { z } from 'zod';

// Keep names international while excluding markup, digits and control characters.
export const PERSON_NAME_PATTERN = /^\p{L}[\p{L}\p{M} .’'-]*$/u;
export const RESOURCE_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} ._()'’-]*$/u;
export const REPOSITORY_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9_][A-Za-z0-9_.-]*$/;
export const DNS_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
export const DNS_SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;

export const NameSchema = z.string().trim().min(1, 'Name is required')
  .max(255, 'Name must be 255 characters or fewer')
  .regex(PERSON_NAME_PATTERN, 'Use letters, spaces, apostrophes, periods or hyphens for your name');

export const EmailSchema = z.string().trim().min(1, 'Email is required')
  .max(255, 'Email must be 255 characters or fewer').email('Enter a valid email address');

export const resourceName = (label: string, max = 100) => z.string().trim()
  .min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`)
  .regex(RESOURCE_NAME_PATTERN, `${label} must start with a letter or number and use letters, numbers, spaces, periods, underscores, apostrophes, parentheses or hyphens`);

export const textField = (label: string, max: number) => z.string().trim()
  .max(max, `${label} must be ${max} characters or fewer`)
  .refine(value => !/[\p{Cc}]/u.test(value.replace(/[\r\n\t]/g, '')), `${label} must not contain control characters`);

// Parse URLs as URLs: a scheme-only regex also accepts malformed hosts and ports.
export function isEndpointUrl(value: string, protocols = ['http:', 'https:']): boolean {
  if (value.length > 2048 || /[\s\\\p{Cc}]/u.test(value) || !/^[a-z]+:\/\/[^/]/i.test(value)) return false;
  try {
    const url = new URL(value);
    return protocols.includes(url.protocol) && !!url.hostname && !url.username && !url.password && !url.hash
      && (!url.port || (Number(url.port) >= 1 && Number(url.port) <= 65535));
  } catch {
    return false;
  }
}

export const RepositoryUrlSchema = z.string().trim().max(2048, 'Repository URL is too long')
  .refine(value => {
    if (!value) return true;
    if (!isEndpointUrl(value)) return false;
    const url = new URL(value);
    return /^(www\.)?(github|gitlab)\.com$/i.test(url.hostname)
      && /^\/[^/\s]+\/[^/\s]+(?:\/[^\s]*)?$/.test(url.pathname);
  }, 'Enter a GitHub or GitLab repository URL, such as https://github.com/owner/repo');

export const ProjectFieldsSchema = z.object({
  projectName: resourceName('Project name'),
  description: textField('Description', 1000).optional(),
  repositoryUrl: RepositoryUrlSchema.optional(),
  environment: z.enum(['dev', 'staging', 'prod'], { message: 'Choose a valid environment' }).optional(),
});

export const ProfileSchema = z.object({ name: NameSchema, email: EmailSchema });
export const UserRoleSchema = z.enum(['ADMIN', 'DEVELOPER', 'DEVOPS'], { message: 'Choose a valid platform role' });
export const UserFormSchema = ProfileSchema.extend({ role: UserRoleSchema });

export const JsonObjectSchema = z.string().trim().max(65536, 'JSON must be 65536 characters or fewer')
  .refine(value => {
    if (!value) return true;
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed);
    } catch {
      return false;
    }
  }, 'Enter a valid JSON object, such as {"key":"value"}');

export const AdminIntegrationSchema = z.object({
  name: resourceName('Integration name'),
  providerType: z.enum(['GITHUB', 'LOG_SOURCE', 'SLACK']),
  configJson: JsonObjectSchema,
  active: z.boolean(),
});

export const DeploymentFormSchema = z.object({
  version: z.string().trim().min(1, 'Version is required').max(100, 'Version must be 100 characters or fewer')
    .regex(/^[A-Za-z0-9_][A-Za-z0-9_.+-]*$/, 'Use a version tag such as v1.0.0, a build number or a commit hash'),
  environment: z.enum(['Production', 'Staging', 'QA']),
  status: z.enum(['Succeeded', 'Failed', 'In progress']),
});

export const IncidentFormSchema = z.object({
  projectId: z.number().int().positive('Select a project'),
  title: textField('Incident title', 255).min(1, 'Incident title is required'),
  description: textField('Description', 5000),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  affectedService: textField('Affected service', 255).refine(value => !/[\r\n\t]/.test(value), 'Affected service must be a single line'),
});

export const DockerSourceFormSchema = z.object({
  projectId: z.number().int().positive('Please select a project to connect this host.'),
  name: resourceName('Host name'),
  environment: z.enum(['production', 'staging', 'development']),
});

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    errors[key] ??= issue.message;
  }
  return errors;
}

export const validationMessage = (error: z.ZodError) => Object.values(fieldErrors(error)).join('. ');
