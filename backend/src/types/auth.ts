export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | 'ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  created_at?: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

/**
 * Normalizes database or user-supplied role strings into standard UserRole enum
 */
export function normalizeRole(rawRole: string | undefined | null, department?: string): UserRole {
  if (!rawRole) return 'EMPLOYEE';
  const upper = rawRole.trim().toUpperCase();
  if (upper === 'ADMIN') return 'ADMIN';
  if (upper === 'FINANCE' || (department && department.toLowerCase().trim() === 'finance')) return 'FINANCE';
  if (upper === 'MANAGER' || upper === 'APPROVER') return 'MANAGER';
  return 'EMPLOYEE';
}

