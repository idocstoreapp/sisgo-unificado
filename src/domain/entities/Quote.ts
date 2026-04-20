/**
 * Quote (Cotización) entity - represents a furniture quote
 */

import { Result, ValidationError, BusinessRuleError } from "@/shared/kernel";

export type QuoteStatus = "borrador" | "enviada" | "aprobada" | "rechazada" | "anulada";

export interface QuoteItemProps {
  id: string;
  quoteId: string;
  itemType: "material" | "servicio" | "mueble";
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  metadata?: Record<string, unknown>;
}

export class QuoteItem {
  private constructor(private props: QuoteItemProps) {}

  get id(): string { return this.props.id; }
  get quoteId(): string { return this.props.quoteId; }
  get itemType(): "material" | "servicio" | "mueble" { return this.props.itemType; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get quantity(): number { return this.props.quantity; }
  get unitPrice(): number { return this.props.unitPrice; }
  get totalPrice(): number { return this.props.totalPrice; }
  get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }

  /**
   * Update quantity and recalculate total
   */
  updateQuantity(quantity: number): Result<void, ValidationError> {
    if (quantity <= 0) {
      return Result.fail(new ValidationError("Quantity must be greater than 0", "INVALID_QUANTITY"));
    }
    this.props.quantity = quantity;
    this.props.totalPrice = quantity * this.props.unitPrice;
    return Result.ok(undefined);
  }

  /**
   * Update unit price and recalculate total
   */
  updateUnitPrice(unitPrice: number): Result<void, ValidationError> {
    if (unitPrice < 0) {
      return Result.fail(new ValidationError("Unit price cannot be negative", "NEGATIVE_PRICE"));
    }
    this.props.unitPrice = unitPrice;
    this.props.totalPrice = this.props.quantity * unitPrice;
    return Result.ok(undefined);
  }

  static create(props: Omit<QuoteItemProps, "totalPrice"> & { totalPrice?: number }): Result<QuoteItem, ValidationError> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Item name is required", "ITEM_NAME_REQUIRED"));
    }

    if (props.quantity <= 0) {
      return Result.fail(new ValidationError("Quantity must be greater than 0", "INVALID_QUANTITY"));
    }

    if (props.unitPrice < 0) {
      return Result.fail(new ValidationError("Unit price cannot be negative", "NEGATIVE_PRICE"));
    }

    const totalPrice = props.quantity * props.unitPrice;

    return Result.ok(
      new QuoteItem({
        ...props,
        name: props.name.trim(),
        description: props.description?.trim(),
        totalPrice,
      })
    );
  }
}

export interface QuoteProps {
  id: string;
  companyId: string;
  branchId?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  quoteNumber: string;
  status: QuoteStatus;
  items: QuoteItem[];
  subtotal: number;
  ivaPercentage: number;
  ivaAmount: number;
  profitMargin: number; // Percentage
  profitAmount: number;
  total: number;
  notes?: string;
  terms?: string;
  validUntil?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class Quote {
  private constructor(private props: QuoteProps) {}

  // Getters
  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get branchId(): string | undefined { return this.props.branchId; }
  get customerId(): string { return this.props.customerId; }
  get customerName(): string { return this.props.customerName; }
  get customerEmail(): string | undefined { return this.props.customerEmail; }
  get customerPhone(): string | undefined { return this.props.customerPhone; }
  get quoteNumber(): string { return this.props.quoteNumber; }
  get status(): QuoteStatus { return this.props.status; }
  get items(): QuoteItem[] { return this.props.items; }
  get subtotal(): number { return this.props.subtotal; }
  get ivaPercentage(): number { return this.props.ivaPercentage; }
  get ivaAmount(): number { return this.props.ivaAmount; }
  get profitMargin(): number { return this.props.profitMargin; }
  get profitAmount(): number { return this.props.profitAmount; }
  get total(): number { return this.props.total; }
  get notes(): string | undefined { return this.props.notes; }
  get terms(): string | undefined { return this.props.terms; }
  get validUntil(): Date | undefined { return this.props.validUntil; }
  get approvedAt(): Date | undefined { return this.props.approvedAt; }
  get rejectedAt(): Date | undefined { return this.props.rejectedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  /**
   * Calculate totals from items
   */
  calculateTotals(): void {
    const itemsTotal = this.props.items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    this.props.subtotal = itemsTotal;
    this.props.profitAmount = itemsTotal * (this.props.profitMargin / 100);
    const subtotalWithMargin = itemsTotal + this.props.profitAmount;
    this.props.ivaAmount = subtotalWithMargin * (this.props.ivaPercentage / 100);
    this.props.total = subtotalWithMargin + this.props.ivaAmount;
    this.props.updatedAt = new Date();
  }

  /**
   * Add item to quote
   */
  addItem(item: QuoteItem): Result<void, ValidationError> {
    if (this.props.status !== "borrador") {
      return Result.fail(
        new BusinessRuleError("Cannot add items to a non-draft quote", "QUOTE_NOT_DRAFT")
      );
    }

    this.props.items.push(item);
    this.calculateTotals();
    return Result.ok(undefined);
  }

  /**
   * Remove item from quote
   */
  removeItem(itemId: string): Result<void, ValidationError> {
    if (this.props.status !== "borrador") {
      return Result.fail(
        new BusinessRuleError("Cannot remove items from a non-draft quote", "QUOTE_NOT_DRAFT")
      );
    }

    const itemIndex = this.props.items.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) {
      return Result.fail(new ValidationError("Item not found", "ITEM_NOT_FOUND"));
    }

    this.props.items.splice(itemIndex, 1);
    this.calculateTotals();
    return Result.ok(undefined);
  }

  /**
   * Change quote status
   */
  changeStatus(newStatus: QuoteStatus): Result<void, BusinessRuleError> {
    const validTransitions: Record<QuoteStatus, QuoteStatus[]> = {
      borrador: ["enviada", "anulada"],
      enviada: ["aprobada", "rechazada", "borrador"],
      aprobada: [],
      rechazada: ["borrador"],
      anulada: [],
    };

    if (this.props.status === newStatus) {
      return Result.ok(undefined);
    }

    const allowedTransitions = validTransitions[this.props.status];
    if (!allowedTransitions.includes(newStatus)) {
      return Result.fail(
        new BusinessRuleError(
          `Invalid status transition from "${this.props.status}" to "${newStatus}"`,
          "INVALID_STATUS_TRANSITION"
        )
      );
    }

    this.props.status = newStatus;

    if (newStatus === "aprobada") {
      this.props.approvedAt = new Date();
    } else if (newStatus === "rechazada") {
      this.props.rejectedAt = new Date();
    }

    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update profit margin
   */
  updateProfitMargin(margin: number): Result<void, ValidationError> {
    if (margin < 0) {
      return Result.fail(new ValidationError("Profit margin cannot be negative", "NEGATIVE_MARGIN"));
    }
    this.props.profitMargin = margin;
    this.calculateTotals();
    return Result.ok(undefined);
  }

  /**
   * Update IVA percentage
   */
  updateIvaPercentage(percentage: number): Result<void, ValidationError> {
    if (percentage < 0) {
      return Result.fail(new ValidationError("IVA percentage cannot be negative", "NEGATIVE_IVA"));
    }
    this.props.ivaPercentage = percentage;
    this.calculateTotals();
    return Result.ok(undefined);
  }

  /**
   * Check if quote is valid (not expired)
   */
  isValid(referenceDate: Date = new Date()): boolean {
    if (this.props.status === "anulada") {
      return false;
    }
    if (this.props.validUntil) {
      return referenceDate <= this.props.validUntil;
    }
    return true;
  }

  /**
   * Check if quote is expired
   */
  isExpired(referenceDate: Date = new Date()): boolean {
    return !this.isValid(referenceDate);
  }

  /**
   * Check if quote is approved
   */
  isApproved(): boolean {
    return this.props.status === "aprobada";
  }

  /**
   * Create a new quote with validation
   */
  static create(
    props: Omit<QuoteProps, "createdAt" | "updatedAt" | "status" | "subtotal" | "ivaAmount" | "profitAmount" | "total" | "items"> & 
    Partial<Pick<QuoteProps, "createdAt" | "updatedAt" | "status" | "subtotal" | "ivaAmount" | "profitAmount" | "total" | "items">>
  ): Result<Quote, ValidationError> {
    if (!props.customerId) {
      return Result.fail(new ValidationError("Customer is required", "CUSTOMER_REQUIRED"));
    }

    if (!props.customerName || props.customerName.trim().length === 0) {
      return Result.fail(new ValidationError("Customer name is required", "CUSTOMER_NAME_REQUIRED"));
    }

    if (!props.quoteNumber || props.quoteNumber.trim().length === 0) {
      return Result.fail(new ValidationError("Quote number is required", "QUOTE_NUMBER_REQUIRED"));
    }

    return Result.ok(
      new Quote({
        ...props,
        customerName: props.customerName.trim(),
        customerEmail: props.customerEmail?.trim(),
        customerPhone: props.customerPhone?.trim(),
        notes: props.notes?.trim(),
        terms: props.terms?.trim(),
        status: props.status ?? "borrador",
        items: props.items ?? [],
        ivaPercentage: props.ivaPercentage ?? 19,
        profitMargin: props.profitMargin ?? 0,
        subtotal: props.subtotal ?? 0,
        ivaAmount: props.ivaAmount ?? 0,
        profitAmount: props.profitAmount ?? 0,
        total: props.total ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      })
    );
  }
}
