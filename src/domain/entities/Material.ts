/**
 * Material entity - represents materials used in furniture quotes
 */

import { Result, ValidationError } from "@/shared/kernel";

export type MaterialUnit = "un" | "kg" | "gr" | "lt" | "ml" | "m2" | "m3" | "ml";

export interface MaterialProps {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category?: string;
  unitType: MaterialUnit;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  supplierId?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class Material {
  private constructor(private props: MaterialProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get category(): string | undefined { return this.props.category; }
  get unitType(): MaterialUnit { return this.props.unitType; }
  get costPrice(): number { return this.props.costPrice; }
  get salePrice(): number { return this.props.salePrice; }
  get currentStock(): number { return this.props.currentStock; }
  get minStock(): number { return this.props.minStock; }
  get supplierId(): string | undefined { return this.props.supplierId; }
  get imageUrl(): string | undefined { return this.props.imageUrl; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  /**
   * Check if stock is low
   */
  isLowStock(): boolean {
    return this.props.currentStock <= this.props.minStock;
  }

  /**
   * Update stock
   */
  updateStock(quantity: number, direction: "IN" | "OUT"): Result<void, ValidationError> {
    if (direction === "OUT" && quantity > this.props.currentStock) {
      return Result.fail(
        new ValidationError("Insufficient stock", "INSUFFICIENT_STOCK")
      );
    }

    if (direction === "IN") {
      this.props.currentStock += quantity;
    } else {
      this.props.currentStock -= quantity;
    }

    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update sale price
   */
  updateSalePrice(price: number): Result<void, ValidationError> {
    if (price < 0) {
      return Result.fail(new ValidationError("Sale price cannot be negative", "NEGATIVE_PRICE"));
    }
    this.props.salePrice = price;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update cost price
   */
  updateCostPrice(price: number): Result<void, ValidationError> {
    if (price < 0) {
      return Result.fail(new ValidationError("Cost price cannot be negative", "NEGATIVE_PRICE"));
    }
    this.props.costPrice = price;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Deactivate material
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Activate material
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Calculate profit margin
   */
  getProfitMargin(): number {
    if (this.props.salePrice === 0) return 0;
    return ((this.props.salePrice - this.props.costPrice) / this.props.salePrice) * 100;
  }

  /**
   * Create a new material with validation
   */
  static create(
    props: Omit<MaterialProps, "createdAt" | "updatedAt" | "isActive"> &
      Partial<Pick<MaterialProps, "createdAt" | "updatedAt" | "isActive">>
  ): Result<Material, ValidationError> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Material name is required", "NAME_REQUIRED"));
    }

    if (props.costPrice < 0) {
      return Result.fail(new ValidationError("Cost price cannot be negative", "NEGATIVE_COST"));
    }

    if (props.salePrice < 0) {
      return Result.fail(new ValidationError("Sale price cannot be negative", "NEGATIVE_PRICE"));
    }

    if (props.currentStock < 0) {
      return Result.fail(new ValidationError("Stock cannot be negative", "NEGATIVE_STOCK"));
    }

    if (props.minStock < 0) {
      return Result.fail(new ValidationError("Min stock cannot be negative", "NEGATIVE_MIN_STOCK"));
    }

    return Result.ok(
      new Material({
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
