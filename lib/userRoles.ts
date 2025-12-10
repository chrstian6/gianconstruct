// lib/userRoles.ts

import { USER_ROLES, UserRole } from "@/models/User";

// Helper function to format role for display
export function formatRoleForDisplay(role: UserRole): string {
  switch (role) {
    case USER_ROLES.ADMIN:
      return "Administrator";
    case USER_ROLES.PROJECT_MANAGER:
      return "Project Manager";
    case USER_ROLES.USER:
      return "User";
    default:
      return role;
  }
}

// Helper function to format role for display from string
export function formatRoleDisplay(role: string): string {
  return formatRoleForDisplay(role as UserRole);
}

// Helper function to get all valid roles
export function getValidUserRoles(): string[] {
  return Object.values(USER_ROLES);
}
