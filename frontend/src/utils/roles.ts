export type PlatformRole = 'ADMIN' | 'DEVELOPER' | 'DEVOPS';

export const normalizeRole = (role: string): string =>
  role.trim().toUpperCase().replace(/\s+/g, '_').replace(/^ROLE_/, '');

export const hasRole = (roles: string[] | undefined, role: PlatformRole): boolean =>
  roles?.some((candidate) => normalizeRole(candidate) === role) ?? false;

export const isAdmin = (roles: string[] | undefined): boolean => hasRole(roles, 'ADMIN');

export const canAccessRole = (
  roles: string[] | undefined,
  allowedRoles: PlatformRole[],
): boolean => allowedRoles.some((role) => hasRole(roles, role));
