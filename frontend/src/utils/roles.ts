export type PlatformRole = 'ADMIN' | 'DEVELOPER' | 'DEVOPS';

export const normalizeRole = (role: string): string => {
  const normalized = role.trim().toUpperCase().replace(/\s+/g, '_').replace(/^ROLE_/, '');
  if (normalized === 'ADMINISTRATOR') return 'ADMIN';
  if (normalized === 'DEVOPS_ENGINEER') return 'DEVOPS';
  return normalized;
};

export const hasRole = (roles: string[] | undefined, role: PlatformRole): boolean =>
  roles?.some((candidate) => normalizeRole(candidate) === role) ?? false;

export const isAdmin = (roles: string[] | undefined): boolean => hasRole(roles, 'ADMIN');

export const canAccessRole = (
  roles: string[] | undefined,
  allowedRoles: PlatformRole[],
): boolean => allowedRoles.some((role) => hasRole(roles, role));
