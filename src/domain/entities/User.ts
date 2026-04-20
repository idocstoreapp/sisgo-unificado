/**
 * User entity - represents a system user linked to a company
 */

import { Result, ValidationError } from "@/shared/kernel";
import type { UserRole } from "@/shared/kernel/types";

export interface UserProps {
  id: string;
  companyId: string;
  branchId?: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  permissions: Record<string, boolean>;
  commissionPercentage?: number;
  sueldoBase: number;
  sueldoFrecuencia?: "semanal" | "quincenal" | "mensual";
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get companyId(): string {
    return this.props.companyId;
  }

  get branchId(): string | undefined {
    return this.props.branchId;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }

  get permissions(): Record<string, boolean> {
    return this.props.permissions;
  }

  get commissionPercentage(): number | undefined {
    return this.props.commissionPercentage;
  }

  get sueldoBase(): number {
    return this.props.sueldoBase;
  }

  get sueldoFrecuencia(): "semanal" | "quincenal" | "mensual" | undefined {
    return this.props.sueldoFrecuencia;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    // Super admin and admin have all permissions implicitly
    if (this.props.role === "super_admin" || this.props.role === "admin") {
      return true;
    }
    return this.props.permissions[permission] === true;
  }

  /**
   * Check if user can access a specific section
   */
  canAccessSection(section: string): boolean {
    const sectionPermissions: Record<string, string[]> = {
      orders: ["create_orders", "modify_orders", "view_all_business_orders"],
      customers: ["view_customers", "create_customers", "modify_customers"],
      finance: ["use_statistics_panel", "view_financial_reports"],
      inventory: ["edit_product_stock", "view_inventory"],
      settings: ["use_admin_panel", "manage_settings"],
      reports: ["use_statistics_panel", "view_reports"],
    };

    const requiredPermissions = sectionPermissions[section] ?? [];
    if (this.props.role === "super_admin" || this.props.role === "admin") {
      return true;
    }
    return requiredPermissions.some((perm) => this.hasPermission(perm));
  }

  /**
   * Update user name
   */
  updateName(name: string): Result<void, ValidationError> {
    if (!name || name.trim().length === 0) {
      return Result.fail(new ValidationError("User name is required"));
    }
    this.props.name = name.trim();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update user role
   */
  updateRole(role: UserRole): Result<void, ValidationError> {
    this.props.role = role;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update permissions
   */
  updatePermissions(permissions: Record<string, boolean>): void {
    this.props.permissions = {
      ...this.props.permissions,
      ...permissions,
    };
    this.props.updatedAt = new Date();
  }

  /**
   * Update commission percentage
   */
  updateCommissionPercentage(percentage: number): Result<void, ValidationError> {
    if (percentage < 0 || percentage > 100) {
      return Result.fail(new ValidationError("Commission percentage must be between 0 and 100"));
    }
    this.props.commissionPercentage = percentage;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Deactivate user
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Activate user
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new user with validation
   */
  static create(props: Omit<UserProps, "createdAt" | "updatedAt" | "permissions" | "sueldoBase" | "isActive"> & Partial<Pick<UserProps, "createdAt" | "updatedAt" | "permissions" | "sueldoBase" | "isActive">>): Result<User, ValidationError> {
    // Validate name
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("User name is required", "NAME_REQUIRED"));
    }

    if (props.name.trim().length < 2) {
      return Result.fail(new ValidationError("User name must be at least 2 characters", "NAME_TOO_SHORT"));
    }

    // Validate email
    if (!props.email || !props.email.includes("@")) {
      return Result.fail(new ValidationError("Valid email is required", "INVALID_EMAIL"));
    }

    // Validate commission percentage if provided
    if (props.commissionPercentage !== undefined && (props.commissionPercentage < 0 || props.commissionPercentage > 100)) {
      return Result.fail(new ValidationError("Commission percentage must be between 0 and 100", "INVALID_COMMISSION"));
    }

    // Validate sueldo base
    if (props.sueldoBase !== undefined && props.sueldoBase < 0) {
      return Result.fail(new ValidationError("Base salary cannot be negative", "INVALID_SALARY"));
    }

    return Result.ok(
      new User({
        ...props,
        name: props.name.trim(),
        email: props.email.trim().toLowerCase(),
        permissions: props.permissions ?? {},
        sueldoBase: props.sueldoBase ?? 0,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      })
    );
  }
}
