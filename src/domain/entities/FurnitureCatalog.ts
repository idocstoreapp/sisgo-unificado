/**
 * FurnitureCatalog entity - represents furniture items in catalog
 */

import { Result, ValidationError } from "@/shared/kernel";

export interface FurnitureVariantProps {
  id: string;
  furnitureId: string;
  name: string;
  dimensions?: string;
  color?: string;
  material?: string;
  additionalCost: number;
  isActive: boolean;
}

export class FurnitureVariant {
  private constructor(private props: FurnitureVariantProps) {}

  get id(): string { return this.props.id; }
  get furnitureId(): string { return this.props.furnitureId; }
  get name(): string { return this.props.name; }
  get dimensions(): string | undefined { return this.props.dimensions; }
  get color(): string | undefined { return this.props.color; }
  get material(): string | undefined { return this.props.material; }
  get additionalCost(): number { return this.props.additionalCost; }
  get isActive(): boolean { return this.props.isActive; }

  updateAdditionalCost(cost: number): Result<void, ValidationError> {
    if (cost < 0) {
      return Result.fail(new ValidationError("Additional cost cannot be negative", "NEGATIVE_COST"));
    }
    this.props.additionalCost = cost;
    return Result.ok(undefined);
  }

  static create(props: Omit<FurnitureVariantProps, "isActive"> & Partial<Pick<FurnitureVariantProps, "isActive">>): Result<FurnitureVariant, ValidationError> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Variant name is required", "NAME_REQUIRED"));
    }

    return Result.ok(
      new FurnitureVariant({
        ...props,
        name: props.name.trim(),
        isActive: props.isActive ?? true,
      })
    );
  }
}

export interface FurnitureCatalogProps {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category?: string;
  basePrice: number;
  baseMaterialsCost: number;
  baseLaborHours: number;
  imageUrl?: string;
  variants: FurnitureVariant[];
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class FurnitureCatalog {
  private constructor(private props: FurnitureCatalogProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get category(): string | undefined { return this.props.category; }
  get basePrice(): number { return this.props.basePrice; }
  get baseMaterialsCost(): number { return this.props.baseMaterialsCost; }
  get baseLaborHours(): number { return this.props.baseLaborHours; }
  get imageUrl(): string | undefined { return this.props.imageUrl; }
  get variants(): FurnitureVariant[] { return this.props.variants; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  /**
   * Calculate price with variant
   */
  getPriceWithVariant(variantId?: string): number {
    if (!variantId) return this.props.basePrice;
    
    const variant = this.props.variants.find((v) => v.id === variantId);
    if (!variant) return this.props.basePrice;

    return this.props.basePrice + variant.additionalCost;
  }

  /**
   * Calculate profit margin
   */
  getProfitMargin(): number {
    if (this.props.basePrice === 0) return 0;
    return ((this.props.basePrice - this.props.baseMaterialsCost) / this.props.basePrice) * 100;
  }

  /**
   * Add variant
   */
  addVariant(variant: FurnitureVariant): Result<void, ValidationError> {
    this.props.variants.push(variant);
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Remove variant
   */
  removeVariant(variantId: string): Result<void, ValidationError> {
    const index = this.props.variants.findIndex((v) => v.id === variantId);
    if (index === -1) {
      return Result.fail(new ValidationError("Variant not found", "VARIANT_NOT_FOUND"));
    }
    this.props.variants.splice(index, 1);
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update base price
   */
  updateBasePrice(price: number): Result<void, ValidationError> {
    if (price < 0) {
      return Result.fail(new ValidationError("Base price cannot be negative", "NEGATIVE_PRICE"));
    }
    this.props.basePrice = price;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Deactivate furniture
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Activate furniture
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Create new furniture catalog item
   */
  static create(
    props: Omit<FurnitureCatalogProps, "createdAt" | "updatedAt" | "isActive" | "variants"> &
      Partial<Pick<FurnitureCatalogProps, "createdAt" | "updatedAt" | "isActive" | "variants">>
  ): Result<FurnitureCatalog, ValidationError> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Furniture name is required", "NAME_REQUIRED"));
    }

    if (props.basePrice < 0) {
      return Result.fail(new ValidationError("Base price cannot be negative", "NEGATIVE_PRICE"));
    }

    if (props.baseMaterialsCost < 0) {
      return Result.fail(new ValidationError("Materials cost cannot be negative", "NEGATIVE_COST"));
    }

    if (props.baseLaborHours < 0) {
      return Result.fail(new ValidationError("Labor hours cannot be negative", "NEGATIVE_HOURS"));
    }

    return Result.ok(
      new FurnitureCatalog({
        ...props,
        name: props.name.trim(),
        description: props.description?.trim(),
        category: props.category?.trim(),
        variants: props.variants ?? [],
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      })
    );
  }
}
