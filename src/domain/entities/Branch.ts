/**
 * Branch entity - represents a company location/sucursal
 */

import { Result, ValidationError } from "@/shared/kernel";

export interface BranchProps {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  isActive: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
}

export class Branch {
  private constructor(private props: BranchProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get companyId(): string {
    return this.props.companyId;
  }

  get name(): string {
    return this.props.name;
  }

  get code(): string | undefined {
    return this.props.code;
  }

  get address(): string | undefined {
    return this.props.address;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get logoUrl(): string | undefined {
    return this.props.logoUrl;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get config(): Record<string, unknown> {
    return this.props.config;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  /**
   * Update branch name
   */
  updateName(name: string): Result<void, ValidationError> {
    if (!name || name.trim().length === 0) {
      return Result.fail(new ValidationError("Branch name is required"));
    }
    this.props.name = name.trim();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update branch code
   */
  updateCode(code: string): Result<void, ValidationError> {
    if (code && code.trim().length > 0) {
      this.props.code = code.trim();
      this.props.updatedAt = new Date();
    }
    return Result.ok(undefined);
  }

  /**
   * Activate branch
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Deactivate branch
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Get a config value by key
   */
  getConfig<T>(key: string): T | undefined {
    return this.props.config[key] as T | undefined;
  }

  /**
   * Set a config value
   */
  setConfig(key: string, value: unknown): void {
    this.props.config = {
      ...this.props.config,
      [key]: value,
    };
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new branch with validation
   */
  static create(props: Omit<BranchProps, "createdAt" | "updatedAt" | "config" | "isActive"> & Partial<Pick<BranchProps, "createdAt" | "updatedAt" | "config" | "isActive">>): Result<Branch, ValidationError> {
    // Validate name
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Branch name is required", "NAME_REQUIRED"));
    }

    if (props.name.trim().length < 2) {
      return Result.fail(new ValidationError("Branch name must be at least 2 characters", "NAME_TOO_SHORT"));
    }

    if (props.name.trim().length > 200) {
      return Result.fail(new ValidationError("Branch name must be less than 200 characters", "NAME_TOO_LONG"));
    }

    // Validate code format if provided
    if (props.code && props.code.trim().length > 20) {
      return Result.fail(new ValidationError("Branch code must be less than 20 characters", "CODE_TOO_LONG"));
    }

    return Result.ok(
      new Branch({
        ...props,
        name: props.name.trim(),
        code: props.code?.trim(),
        isActive: props.isActive ?? true,
        config: props.config ?? {},
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      })
    );
  }
}
