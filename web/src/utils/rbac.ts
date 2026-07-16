import { User } from '../types';

/**
 * Check if a user has a specific permission
 * @param user The authenticated user object
 * @param requiredPermission The exact permission action string (e.g. 'Inventory.View')
 * @returns boolean
 */
export const hasPermission = (user: User | null, requiredPermission: string): boolean => {
  if (!user) return false;
  
  // Super Admin / Owner bypass
  if (user.role === 'Super Admin' || user.role === 'Owner') return true;

  if (!user.permissions || !Array.isArray(user.permissions)) {
    return false;
  }

  return user.permissions.includes(requiredPermission);
};

/**
 * Check if a user has ANY of the provided permissions
 * @param user The authenticated user object
 * @param permissions Array of permission action strings
 * @returns boolean
 */
export const hasAnyPermission = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;

  // Super Admin / Owner bypass
  if (user.role === 'Super Admin' || user.role === 'Owner') return true;

  if (!user.permissions || !Array.isArray(user.permissions)) {
    return false;
  }

  return permissions.some(p => user.permissions?.includes(p));
};

/**
 * Check if a user has ALL of the provided permissions
 * @param user The authenticated user object
 * @param permissions Array of permission action strings
 * @returns boolean
 */
export const hasAllPermissions = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;

  // Super Admin / Owner bypass
  if (user.role === 'Super Admin' || user.role === 'Owner') return true;

  if (!user.permissions || !Array.isArray(user.permissions)) {
    return false;
  }

  return permissions.every(p => user.permissions?.includes(p));
};
