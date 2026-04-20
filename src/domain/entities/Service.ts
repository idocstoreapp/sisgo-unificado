/**
 * Service entity - represents labor/services for furniture quotes
 */

import { Result, ValidationError } from "@/shared/kernel";

export interface ServiceProps {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category?: string;
  pricePerHour: number;
  estimatedHours?: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class Service {
  private constructor(private props: ServiceProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get category(): string | undefined { return this.props.category; }
  get pricePerHour(): number { return this.props.pricePerHour; }
  get estimatedHours(): number | undefined { return this.props.estimatedHours; }
  get imageUrl(): string | undefined { return this.props.imageUrl; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  /**
   * Calculate total price for given hours
   */
  calculatePrice(hours: number): number {
    return hours * this.props.pricePerHour;
  }

  /**
   * Update price per hour
   */
  updatePricePerHour(price: number): Result<void, ValidationError> {
    if (price < 0) {
      return Result.fail(new ValidationError("Price per hour cannot be negative", "NEGATIVE_PRICE"));
    }
    this.props.pricePerHour = price;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update estimated hours
   */
  updateEstimatedHours(hours: number): Result<void, ValidationError> {
    if (hours < 0) {
      return Result.fail(new ValidationError("Estimated hours cannot be negative", "NEGATIVE_HOURS"));
    }
    this.props.estimatedHours = hours;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Deactivate service
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Activate service
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new service with validation
   */
  static create(
    props: Omit<ServiceProps, "createdAt" | "updatedAt" | "isActive"> &
      Partial<Pick<ServiceProps, "createdAt" | "updatedAt" | "isActive">>
  ): Result<Service, ValidationError> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Service name is required", "NAME_REQUIRED"));
    }

    if (props.pricePerHour < 0) {
      return Result.fail(new ValidationError("Price per hour cannot be negative", "NEGATIVE_PRICE"));
    }

    return Result.ok(
      new Service({
        ...props,
        name: props.name.trim(),
        description: props.description?.trim(),
        category: props.category?.trim(),
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      })
    );
  }
}
