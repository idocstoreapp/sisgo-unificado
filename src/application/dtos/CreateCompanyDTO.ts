/**
 * Data Transfer Objects for application layer
 */

import type { BusinessType, UserRole } from "@/shared/kernel/types";

/**
 * DTO for creating a company
 */
export interface CreateCompanyDTO {
  name: string;
  businessType: BusinessType;
  rut?: string;
  razonSocial?: string;
  email?: string;
  phone?: string;
  address?: string;
  ivaPercentage?: number;
  commissionPercentage?: number;
}

/**
 * DTO for creating a user
 */
export interface CreateUserDTO {
  companyId: string;
  branchId?: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  permissions?: Record<string, boolean>;
  commissionPercentage?: number;
  sueldoBase?: number;
  sueldoFrecuencia?: "semanal" | "quincenal" | "mensual";
}

/**
 * DTO for creating a branch
 */
export interface CreateBranchDTO {
  companyId: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
}

/**
 * DTO for creating a customer
 */
export interface CreateCustomerDTO {
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  rutDocument?: string;
  address?: string;
  city?: string;
  notes?: string;
}

/**
 * Output DTO for company (without sensitive data)
 */
export interface CompanyOutputDTO {
  id: string;
  name: string;
  businessType: BusinessType;
  rut: string | null;
  razonSocial: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  ivaPercentage: number;
  commissionPercentage: number;
  createdAt: Date;
  updatedAt: Date | null;
}

/**
 * Output DTO for user (without sensitive data)
 */
export interface UserOutputDTO {
  id: string;
  companyId: string;
  branchId: string | null;
  role: UserRole;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  permissions: Record<string, boolean>;
  commissionPercentage: number | null;
  sueldoBase: number;
  sueldoFrecuencia: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

/**
 * Output DTO for branch
 */
export interface BranchOutputDTO {
  id: string;
  companyId: string;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

/**
 * Output DTO for customer
 */
export interface CustomerOutputDTO {
  id: string;
  companyId: string;
  name: string;
  email: string | null;
  phone: string | null;
  phoneCountryCode: string;
  rutDocument: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}
