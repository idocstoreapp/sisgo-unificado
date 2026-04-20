/**
 * StockMovement entity - represents stock movement audit trail
 */

import { Result, ValidationError } from "@/shared/kernel";

export type MovementDirection = "IN" | "OUT" | "ADJUST";
export type MovementReason = "PURCHASE" | "SALE" | "RETURN" | "ADJUSTMENT" | "MANUAL";

export interface StockMovementProps {
  id: string;
  companyId: string;
  productId: string;
  quantity: number;
  direction: MovementDirection;
  reason: MovementReason;
  referenceId?: string; // ID of related order, purchase, etc.
  referenceType?: string; // "order", "purchase", "adjustment", etc.
  notes?: string;
  performedBy?: string; // User ID
  createdAt: Date;
}

export class StockMovement {
  private constructor(private props: StockMovementProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get productId(): string { return this.props.productId; }
  get quantity(): number { return this.props.quantity; }
  get direction(): MovementDirection { return this.props.direction; }
  get reason(): MovementReason { return this.props.reason; }
  get referenceId(): string | undefined { return this.props.referenceId; }
  get referenceType(): string | undefined { return this.props.referenceType; }
  get notes(): string | undefined { return this.props.notes; }
  get performedBy(): string | undefined { return this.props.performedBy; }
  get createdAt(): Date { return this.props.createdAt; }

  /**
   * Check if movement is incoming
   */
  isIncoming(): boolean {
    return this.props.direction === "IN";
  }

  /**
   * Check if movement is outgoing
   */
  isOutgoing(): boolean {
    return this.props.direction === "OUT";
  }

  /**
   * Check if movement is an adjustment
   */
  isAdjustment(): boolean {
    return this.props.direction === "ADJUST";
  }

  /**
   * Get signed quantity (positive for IN, negative for OUT)
   */
  getSignedQuantity(): number {
    if (this.props.direction === "OUT") {
      return -this.props.quantity;
    }
    return this.props.quantity;
  }

  /**
   * Create a new stock movement with validation
   */
  static create(
    props: Omit<StockMovementProps, "createdAt"> &
      Partial<Pick<StockMovementProps, "createdAt">>
  ): Result<StockMovement, ValidationError> {
    if (props.quantity <= 0) {
      return Result.fail(new ValidationError("Quantity must be greater than 0", "INVALID_QUANTITY"));
    }

    if (!props.productId) {
      return Result.fail(new ValidationError("Product is required", "PRODUCT_REQUIRED"));
    }

    if (!props.companyId) {
      return Result.fail(new ValidationError("Company is required", "COMPANY_REQUIRED"));
    }

    return Result.ok(
      new StockMovement({
        ...props,
        notes: props.notes?.trim(),
        createdAt: props.createdAt ?? new Date(),
      })
    );
  }
}

/**
 * Supplier entity - represents suppliers for mechanical workshop
 */
export interface SupplierProps {
  id: string;
  companyId: string;
  name: string;
  contactInfo?: string;
  email?: string;
  phone?: string;
  address?: string;
  rut?: string; // Chilean tax ID
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class Supplier {
  private constructor(private props: SupplierProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get name(): string { return this.props.name; }
  get contactInfo(): string | undefined { return this.props.contactInfo; }
  get email(): string | undefined { return this.props.email; }
  get phone(): string | undefined { return this.props.phone; }
  get address(): string | undefined { return this.props.address; }
  get rut(): string | undefined { return this.props.rut; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  /**
   * Deactivate supplier
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Activate supplier
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new supplier with validation
   */
  static create(
    props: Omit<SupplierProps, "createdAt" | "updatedAt" | "isActive"> &
      Partial<Pick<SupplierProps, "createdAt" | "updatedAt" | "isActive">>
  ): Result<Supplier, ValidationError> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Supplier name is required", "NAME_REQUIRED"));
    }

    return Result.ok(
      new Supplier({
        ...props,
        name: props.name.trim(),
        contactInfo: props.contactInfo?.trim(),
        email: props.email?.trim(),
        phone: props.phone?.trim(),
        address: props.address?.trim(),
        rut: props.rut?.trim(),
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      })
    );
  }
}

/**
 * Purchase entity - represents purchases from suppliers
 */
export type PurchaseStatus = "pending" | "completed" | "cancelled";

export interface PurchaseProps {
  id: string;
  companyId: string;
  supplierId: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  total: number;
  paymentMethod?: string;
  status: PurchaseStatus;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class Purchase {
  private constructor(private props: PurchaseProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get supplierId(): string { return this.props.supplierId; }
  get invoiceNumber(): string | undefined { return this.props.invoiceNumber; }
  get invoiceDate(): Date | undefined { return this.props.invoiceDate; }
  get total(): number { return this.props.total; }
  get paymentMethod(): string | undefined { return this.props.paymentMethod; }
  get status(): PurchaseStatus { return this.props.status; }
  get notes(): string | undefined { return this.props.notes; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  /**
   * Mark purchase as completed
   */
  markAsCompleted(): void {
    this.props.status = "completed";
    this.props.updatedAt = new Date();
  }

  /**
   * Cancel purchase
   */
  cancel(): Result<void, ValidationError> {
    if (this.props.status === "completed") {
      return Result.fail(
        new ValidationError("Cannot cancel a completed purchase", "CANNOT_CANCEL_COMPLETED")
      );
    }

    this.props.status = "cancelled";
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update invoice information
   */
  updateInvoice(invoiceNumber: string, invoiceDate: Date): void {
    this.props.invoiceNumber = invoiceNumber;
    this.props.invoiceDate = invoiceDate;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if purchase is pending
   */
  isPending(): boolean {
    return this.props.status === "pending";
  }

  /**
   * Create a new purchase with validation
   */
  static create(
    props: Omit<PurchaseProps, "createdAt" | "updatedAt" | "status"> &
      Partial<Pick<PurchaseProps, "createdAt" | "updatedAt" | "status">>
  ): Result<Purchase, ValidationError> {
    if (!props.supplierId) {
      return Result.fail(new ValidationError("Supplier is required", "SUPPLIER_REQUIRED"));
    }

    if (props.total < 0) {
      return Result.fail(new ValidationError("Total cannot be negative", "NEGATIVE_TOTAL"));
    }

    return Result.ok(
      new Purchase({
        ...props,
        status: props.status ?? "pending",
        notes: props.notes?.trim(),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      })
    );
  }
}

/**
 * PurchaseItem entity - represents items in a purchase
 */
export interface PurchaseItemProps {
  id: string;
  purchaseId: string;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export class PurchaseItem {
  private constructor(private props: PurchaseItemProps) {}

  get id(): string { return this.props.id; }
  get purchaseId(): string { return this.props.purchaseId; }
  get productId(): string | undefined { return this.props.productId; }
  get name(): string { return this.props.name; }
  get quantity(): number { return this.props.quantity; }
  get unitPrice(): number { return this.props.unitPrice; }
  get totalPrice(): number { return this.props.totalPrice; }

  /**
   * Create a new purchase item with validation
   */
  static create(
    props: Omit<PurchaseItemProps, "totalPrice"> &
      Partial<Pick<PurchaseItemProps, "totalPrice">>
  ): Result<PurchaseItem, ValidationError> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Item name is required", "NAME_REQUIRED"));
    }

    if (props.quantity <= 0) {
      return Result.fail(new ValidationError("Quantity must be greater than 0", "INVALID_QUANTITY"));
    }

    if (props.unitPrice < 0) {
      return Result.fail(new ValidationError("Unit price cannot be negative", "NEGATIVE_PRICE"));
    }

    const totalPrice = props.quantity * props.unitPrice;

    return Result.ok(
      new PurchaseItem({
        ...props,
        name: props.name.trim(),
        totalPrice,
      })
    );
  }
}
