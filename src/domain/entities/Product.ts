/**
 * Product entity - represents inventory products/parts for mechanical workshop
 */

import { Result, ValidationError } from "@/shared/kernel";

export type ProductType = "producto" | "repuesto" | "insumo";
export type ProductUnit = "un" | "kg" | "gr" | "lt" | "ml";

export interface ProductProps {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category?: string;
  type: ProductType;
  barcode?: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unitType: ProductUnit;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class Product {
  private constructor(private props: ProductProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get category(): string | undefined { return this.props.category; }
  get type(): ProductType { return this.props.type; }
  get barcode(): string | undefined { return this.props.barcode; }
  get costPrice(): number { return this.props.costPrice; }
  get salePrice(): number { return this.props.salePrice; }
  get stock(): number { return this.props.stock; }
  get minStock(): number { return this.props.minStock; }
  get unitType(): ProductUnit { return this.props.unitType; }
  get imageUrl(): string | undefined { return this.props.imageUrl; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  /**
   * Check if stock is low
   */
  isLowStock(): boolean {
    return this.props.stock <= this.props.minStock;
  }

  /**
   * Check if product is out of stock
   */
  isOutOfStock(): boolean {
    return this.props.stock === 0;
  }

  /**
   * Calculate profit margin
   */
  getProfitMargin(): number {
    if (this.props.salePrice === 0) return 0;
    return ((this.props.salePrice - this.props.costPrice) / this.props.salePrice) * 100;
  }

  /**
   * Update stock (for internal adjustments)
   */
  adjustStock(quantity: number, reason: string): Result<void, ValidationError> {
    const newStock = this.props.stock + quantity;
    
    if (newStock < 0) {
      return Result.fail(
        new ValidationError("Insufficient stock", "INSUFFICIENT_STOCK")
      );
    }

    this.props.stock = newStock;
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
   * Update minimum stock threshold
   */
  updateMinStock(minStock: number): Result<void, ValidationError> {
    if (minStock < 0) {
      return Result.fail(new ValidationError("Min stock cannot be negative", "NEGATIVE_MIN_STOCK"));
    }
    this.props.minStock = minStock;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Deactivate product
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Activate product
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Update barcode
   */
  updateBarcode(barcode: string): void {
    this.props.barcode = barcode;
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new product with validation
   */
  static create(
    props: Omit<ProductProps, "createdAt" | "updatedAt" | "isActive"> &
      Partial<Pick<ProductProps, "createdAt" | "updatedAt" | "isActive">>
  ): Result<Product, ValidationError> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Product name is required", "NAME_REQUIRED"));
    }

    if (props.costPrice < 0) {
      return Result.fail(new ValidationError("Cost price cannot be negative", "NEGATIVE_COST"));
    }

    if (props.salePrice < 0) {
      return Result.fail(new ValidationError("Sale price cannot be negative", "NEGATIVE_PRICE"));
    }

    if (props.stock < 0) {
      return Result.fail(new ValidationError("Stock cannot be negative", "NEGATIVE_STOCK"));
    }

    if (props.minStock < 0) {
      return Result.fail(new ValidationError("Min stock cannot be negative", "NEGATIVE_MIN_STOCK"));
    }

    return Result.ok(
      new Product({
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
