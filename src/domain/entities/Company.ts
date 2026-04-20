/**
 * Company entity - represents a business registered in the system
 */

import { Result, ValidationError, BusinessRuleError } from "@/shared/kernel";
import type { BusinessType } from "@/shared/kernel/types";

export interface CompanyProps {
  id: string;
  name: string;
  businessType: BusinessType;
  rut?: string;
  razonSocial?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  config: Record<string, unknown>;
  ivaPercentage: number;
  commissionPercentage: number;
  createdAt: Date;
  updatedAt?: Date;
}

export class Company {
  private constructor(private props: CompanyProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get businessType(): BusinessType {
    return this.props.businessType;
  }

  get rut(): string | undefined {
    return this.props.rut;
  }

  get razonSocial(): string | undefined {
    return this.props.razonSocial;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get address(): string | undefined {
    return this.props.address;
  }

  get logoUrl(): string | undefined {
    return this.props.logoUrl;
  }

  get config(): Record<string, unknown> {
    return this.props.config;
  }

  get ivaPercentage(): number {
    return this.props.ivaPercentage;
  }

  get commissionPercentage(): number {
    return this.props.commissionPercentage;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  /**
   * Update company name
   */
  updateName(name: string): Result<void, ValidationError> {
    if (!name || name.trim().length === 0) {
      return Result.fail(new ValidationError("Company name is required"));
    }
    this.props.name = name.trim();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update IVA percentage
   */
  updateIvaPercentage(percentage: number): Result<void, ValidationError> {
    if (percentage < 0 || percentage > 100) {
      return Result.fail(new ValidationError("IVA percentage must be between 0 and 100"));
    }
    this.props.ivaPercentage = percentage;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
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
   * Create a new company with validation
   */
  static create(props: Omit<CompanyProps, "createdAt" | "updatedAt" | "config"> & Partial<Pick<CompanyProps, "createdAt" | "updatedAt" | "config">>): Result<Company, ValidationError> {
    // Validate name
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Company name is required", "NAME_REQUIRED"));
    }

    if (props.name.trim().length < 2) {
      return Result.fail(new ValidationError("Company name must be at least 2 characters", "NAME_TOO_SHORT"));
    }

    if (props.name.trim().length > 200) {
      return Result.fail(new ValidationError("Company name must be less than 200 characters", "NAME_TOO_LONG"));
    }

    // Validate IVA percentage
    if (props.ivaPercentage < 0 || props.ivaPercentage > 100) {
      return Result.fail(new ValidationError("IVA percentage must be between 0 and 100", "INVALID_IVA"));
    }

    // Validate commission percentage
    if (props.commissionPercentage < 0 || props.commissionPercentage > 100) {
      return Result.fail(new ValidationError("Commission percentage must be between 0 and 100", "INVALID_COMMISSION"));
    }

    // Validate RUT format if provided
    if (props.rut && !Company.isValidRut(props.rut)) {
      return Result.fail(new ValidationError("Invalid RUT format", "INVALID_RUT"));
    }

    return Result.ok(
      new Company({
        ...props,
        name: props.name.trim(),
        config: props.config ?? {},
        ivaPercentage: props.ivaPercentage,
        commissionPercentage: props.commissionPercentage,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      })
    );
  }

  /**
   * Simple RUT validation for Chilean format
   */
  private static isValidRut(rut: string): boolean {
    // Remove dots and dash
    const cleanRut = rut.replace(/[.-]/g, "");
    if (cleanRut.length < 2) return false;

    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();

    if (!/^\d+$/.test(body)) return false;

    // Calculate verification digit
    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const calculatedDv = 11 - (sum % 11);
    const expectedDv = calculatedDv === 11 ? "0" : calculatedDv === 10 ? "K" : calculatedDv.toString();

    return dv === expectedDv;
  }
}
