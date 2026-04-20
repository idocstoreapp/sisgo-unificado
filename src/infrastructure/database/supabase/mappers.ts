/**
 * Mappers - convert between database rows and domain entities
 */

import { Company, type CompanyProps } from "@/domain/entities/Company";
import { Branch, type BranchProps } from "@/domain/entities/Branch";
import { User, type UserProps } from "@/domain/entities/User";
import { Customer, type CustomerProps } from "@/domain/entities/Customer";
import type { Database } from "@/infrastructure/database/supabase/database.types";

type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
type BranchRow = Database["public"]["Tables"]["branches"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];

/**
 * Map database company row to domain Company entity
 */
export function toCompany(row: CompanyRow): Company {
  const props: CompanyProps = {
    id: row.id,
    name: row.name,
    businessType: row.business_type as CompanyProps["businessType"],
    rut: row.rut ?? undefined,
    razonSocial: row.razon_social ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    config: (row.config as Record<string, unknown>) ?? {},
    ivaPercentage: Number(row.iva_percentage),
    commissionPercentage: Number(row.commission_percentage),
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };

  return new Company(props);
}

/**
 * Map domain Company entity to database insert object
 */
export function fromCompanyToInsert(company: Company): Database["public"]["Tables"]["companies"]["Insert"] {
  return {
    id: company.id,
    name: company.name,
    business_type: company.businessType,
    rut: company.rut ?? null,
    razon_social: company.razonSocial ?? null,
    email: company.email ?? null,
    phone: company.phone ?? null,
    address: company.address ?? null,
    logo_url: company.logoUrl ?? null,
    config: company.config,
    iva_percentage: company.ivaPercentage,
    commission_percentage: company.commissionPercentage,
  };
}

/**
 * Map domain Company entity to database update object
 */
export function fromCompanyToUpdate(company: Company): Database["public"]["Tables"]["companies"]["Update"] {
  return {
    name: company.name,
    business_type: company.businessType,
    rut: company.rut ?? null,
    razon_social: company.razonSocial ?? null,
    email: company.email ?? null,
    phone: company.phone ?? null,
    address: company.address ?? null,
    logo_url: company.logoUrl ?? null,
    config: company.config,
    iva_percentage: company.ivaPercentage,
    commission_percentage: company.commissionPercentage,
    updated_at: company.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

/**
 * Map database branch row to domain Branch entity
 */
export function toBranch(row: BranchRow): Branch {
  const props: BranchProps = {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    code: row.code ?? undefined,
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    isActive: row.is_active,
    config: (row.config as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };

  return new Branch(props);
}

/**
 * Map domain Branch entity to database insert object
 */
export function fromBranchToInsert(branch: Branch): Database["public"]["Tables"]["branches"]["Insert"] {
  return {
    id: branch.id,
    company_id: branch.companyId,
    name: branch.name,
    code: branch.code ?? null,
    address: branch.address ?? null,
    phone: branch.phone ?? null,
    email: branch.email ?? null,
    logo_url: branch.logoUrl ?? null,
    is_active: branch.isActive,
    config: branch.config,
  };
}

/**
 * Map domain Branch entity to database update object
 */
export function fromBranchToUpdate(branch: Branch): Database["public"]["Tables"]["branches"]["Update"] {
  return {
    name: branch.name,
    code: branch.code ?? null,
    address: branch.address ?? null,
    phone: branch.phone ?? null,
    email: branch.email ?? null,
    logo_url: branch.logoUrl ?? null,
    is_active: branch.isActive,
    config: branch.config,
    updated_at: branch.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

/**
 * Map database user row to domain User entity
 */
export function toUser(row: UserRow): User {
  const props: UserProps = {
    id: row.id,
    companyId: row.company_id,
    branchId: row.branch_id ?? undefined,
    role: row.role as UserProps["role"],
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    permissions: (row.permissions as Record<string, boolean>) ?? {},
    commissionPercentage: row.commission_percentage != null ? Number(row.commission_percentage) : undefined,
    sueldoBase: Number(row.sueldo_base),
    sueldoFrecuencia: row.sueldo_frecuencia as UserProps["sueldoFrecuencia"],
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };

  return new User(props);
}

/**
 * Map domain User entity to database insert object
 */
export function fromUserToInsert(user: User): Database["public"]["Tables"]["users"]["Insert"] {
  return {
    id: user.id,
    company_id: user.companyId,
    branch_id: user.branchId ?? null,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    avatar_url: user.avatarUrl ?? null,
    permissions: user.permissions,
    commission_percentage: user.commissionPercentage ?? null,
    sueldo_base: user.sueldoBase,
    sueldo_frecuencia: user.sueldoFrecuencia ?? null,
    is_active: user.isActive,
  };
}

/**
 * Map domain User entity to database update object
 */
export function fromUserToUpdate(user: User): Database["public"]["Tables"]["users"]["Update"] {
  return {
    company_id: user.companyId,
    branch_id: user.branchId ?? null,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    avatar_url: user.avatarUrl ?? null,
    permissions: user.permissions,
    commission_percentage: user.commissionPercentage ?? null,
    sueldo_base: user.sueldoBase,
    sueldo_frecuencia: user.sueldoFrecuencia ?? null,
    is_active: user.isActive,
    updated_at: user.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

/**
 * Map database customer row to domain Customer entity
 */
export function toCustomer(row: CustomerRow): Customer {
  const props: CustomerProps = {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    phoneCountryCode: row.phone_country_code,
    rutDocument: row.rut_document ?? undefined,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };

  return new Customer(props);
}

/**
 * Map domain Customer entity to database insert object
 */
export function fromCustomerToInsert(customer: Customer): Database["public"]["Tables"]["customers"]["Insert"] {
  return {
    id: customer.id,
    company_id: customer.companyId,
    name: customer.name,
    email: customer.email ?? null,
    phone: customer.phone ?? null,
    phone_country_code: customer.phoneCountryCode,
    rut_document: customer.rutDocument ?? null,
    address: customer.address ?? null,
    city: customer.city ?? null,
    notes: customer.notes ?? null,
  };
}

/**
 * Map domain Customer entity to database update object
 */
export function fromCustomerToUpdate(customer: Customer): Database["public"]["Tables"]["customers"]["Update"] {
  return {
    name: customer.name,
    email: customer.email ?? null,
    phone: customer.phone ?? null,
    phone_country_code: customer.phoneCountryCode,
    rut_document: customer.rutDocument ?? null,
    address: customer.address ?? null,
    city: customer.city ?? null,
    notes: customer.notes ?? null,
    updated_at: customer.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}
