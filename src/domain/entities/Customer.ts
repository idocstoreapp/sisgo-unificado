/**
 * Customer entity - represents a client of a company
 */

import { Result, ValidationError } from "@/shared/kernel";

export interface CustomerProps {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  phoneCountryCode: string;
  rutDocument?: string;
  address?: string;
  city?: string;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class Customer {
  private constructor(private props: CustomerProps) {}

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

  get email(): string | undefined {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get phoneCountryCode(): string {
    return this.props.phoneCountryCode;
  }

  get rutDocument(): string | undefined {
    return this.props.rutDocument;
  }

  get address(): string | undefined {
    return this.props.address;
  }

  get city(): string | undefined {
    return this.props.city;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  /**
   * Get full phone number with country code
   */
  get fullPhone(): string | undefined {
    if (!this.props.phone) return undefined;
    return `${this.props.phoneCountryCode}${this.props.phone}`;
  }

  /**
   * Update customer name
   */
  updateName(name: string): Result<void, ValidationError> {
    if (!name || name.trim().length === 0) {
      return Result.fail(new ValidationError("Customer name is required"));
    }
    this.props.name = name.trim();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update email
   */
  updateEmail(email: string | undefined): Result<void, ValidationError> {
    if (email && email.trim().length > 0 && !email.includes("@")) {
      return Result.fail(new ValidationError("Invalid email format"));
    }
    this.props.email = email?.trim();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update phone
   */
  updatePhone(phone: string | undefined, countryCode: string = "+56"): Result<void, ValidationError> {
    if (phone && phone.trim().length > 0) {
      this.props.phone = phone.trim();
      this.props.phoneCountryCode = countryCode;
      this.props.updatedAt = new Date();
    }
    return Result.ok(undefined);
  }

  /**
   * Update RUT document
   */
  updateRutDocument(rut: string | undefined): void {
    this.props.rutDocument = rut?.trim();
    this.props.updatedAt = new Date();
  }

  /**
   * Update address
   */
  updateAddress(address: string | undefined): void {
    this.props.address = address?.trim();
    this.props.updatedAt = new Date();
  }

  /**
   * Update notes
   */
  updateNotes(notes: string | undefined): void {
    this.props.notes = notes;
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new customer with validation
   */
  static create(props: Omit<CustomerProps, "createdAt" | "updatedAt" | "phoneCountryCode"> & Partial<Pick<CustomerProps, "createdAt" | "updatedAt" | "phoneCountryCode">>): Result<Customer, ValidationError> {
    // Validate name
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Customer name is required", "NAME_REQUIRED"));
    }

    if (props.name.trim().length < 2) {
      return Result.fail(new ValidationError("Customer name must be at least 2 characters", "NAME_TOO_SHORT"));
    }

    if (props.name.trim().length > 200) {
      return Result.fail(new ValidationError("Customer name must be less than 200 characters", "NAME_TOO_LONG"));
    }

    // Validate email if provided
    if (props.email && props.email.trim().length > 0 && !props.email.includes("@")) {
      return Result.fail(new ValidationError("Invalid email format", "INVALID_EMAIL"));
    }

    return Result.ok(
      new Customer({
        ...props,
        name: props.name.trim(),
        email: props.email?.trim(),
        phone: props.phone?.trim(),
        phoneCountryCode: props.phoneCountryCode ?? "+56",
        rutDocument: props.rutDocument?.trim(),
        address: props.address?.trim(),
        city: props.city?.trim(),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      })
    );
  }
}
