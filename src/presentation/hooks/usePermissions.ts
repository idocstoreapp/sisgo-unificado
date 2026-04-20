/**
 * usePermissions hook - provides permission checking utilities
 */

"use client";

import { useCallback } from "react";
import type { UserRole } from "@/shared/kernel/types";

interface UsePermissionsReturn {
  hasPermission: (userRole: UserRole, permissions: Record<string, boolean>, permission: string) => boolean;
  canAccessSection: (userRole: UserRole, permissions: Record<string, boolean>, section: string) => boolean;
  isSuperAdmin: (role: UserRole) => boolean;
  isAdmin: (role: UserRole) => boolean;
}

const sectionPermissions: Record<string, string[]> = {
  orders: ["create_orders", "modify_orders", "view_all_business_orders"],
  customers: ["view_customers", "create_customers", "modify_customers"],
  finance: ["use_statistics_panel", "view_financial_reports"],
  inventory: ["edit_product_stock", "view_inventory"],
  settings: ["use_admin_panel", "manage_settings"],
  reports: ["use_statistics_panel", "view_reports"],
};

export function usePermissions(): UsePermissionsReturn {
  const hasPermission = useCallback(
    (userRole: UserRole, permissions: Record<string, boolean>, permission: string): boolean => {
      // Super admin and admin have all permissions implicitly
      if (userRole === "super_admin" || userRole === "admin") {
        return true;
      }
      return permissions[permission] === true;
    },
    []
  );

  const canAccessSection = useCallback(
    (userRole: UserRole, permissions: Record<string, boolean>, section: string): boolean => {
      // Super admin and admin can access everything
      if (userRole === "super_admin" || userRole === "admin") {
        return true;
      }

      const requiredPermissions = sectionPermissions[section] ?? [];
      return requiredPermissions.some((perm) => permissions[perm] === true);
    },
    []
  );

  const isSuperAdmin = useCallback((role: UserRole): boolean => {
    return role === "super_admin";
  }, []);

  const isAdmin = useCallback((role: UserRole): boolean => {
    return role === "admin" || role === "super_admin";
  }, []);

  return {
    hasPermission,
    canAccessSection,
    isSuperAdmin,
    isAdmin,
  };
}
