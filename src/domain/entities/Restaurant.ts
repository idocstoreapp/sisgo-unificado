/**
 * Restaurant entities - Table, MenuCategory, MenuItem, RestaurantOrder, OrderItem, Ingredient, Recipe
 */

import { Result, ValidationError } from "@/shared/kernel";

// ==================== TABLE ENTITY ====================

export type TableStatus = "disponible" | "ocupada" | "reservada" | "en_limpieza";

export interface TableProps {
  id: string;
  companyId: string;
  branchId?: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  location?: string; // "terraza", "interior", etc.
  currentOrderId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class TableEntity {
  private constructor(private props: TableProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get branchId(): string | undefined { return this.props.branchId; }
  get tableNumber(): string { return this.props.tableNumber; }
  get capacity(): number { return this.props.capacity; }
  get status(): TableStatus { return this.props.status; }
  get location(): string | undefined { return this.props.location; }
  get currentOrderId(): string | undefined { return this.props.currentOrderId; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  occupy(orderId: string): Result<void, ValidationError> {
    if (this.props.status !== "disponible") {
      return Result.fail(new ValidationError("Table is not available", "TABLE_NOT_AVAILABLE"));
    }
    this.props.status = "ocupada";
    this.props.currentOrderId = orderId;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  free(): Result<void, ValidationError> {
    this.props.status = "en_limpieza";
    this.props.currentOrderId = undefined;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  markAsClean(): Result<void, ValidationError> {
    if (this.props.status !== "en_limpieza") {
      return Result.fail(new ValidationError("Table must be in cleaning status", "NOT_CLEANING"));
    }
    this.props.status = "disponible";
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  reserve(): Result<void, ValidationError> {
    if (this.props.status !== "disponible") {
      return Result.fail(new ValidationError("Table is not available", "TABLE_NOT_AVAILABLE"));
    }
    this.props.status = "reservada";
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  isAvailable(): boolean {
    return this.props.status === "disponible";
  }

  isOccupied(): boolean {
    return this.props.status === "ocupada";
  }

  static create(props: Omit<TableProps, "createdAt" | "updatedAt" | "isActive" | "status"> & Partial<Pick<TableProps, "createdAt" | "updatedAt" | "isActive" | "status">>): Result<TableEntity, ValidationError> {
    if (!props.tableNumber || props.tableNumber.trim().length === 0) {
      return Result.fail(new ValidationError("Table number is required", "TABLE_NUMBER_REQUIRED"));
    }
    if (props.capacity <= 0) {
      return Result.fail(new ValidationError("Capacity must be greater than 0", "INVALID_CAPACITY"));
    }
    return Result.ok(new TableEntity({
      ...props,
      status: props.status ?? "disponible",
      isActive: props.isActive ?? true,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt,
    }));
  }
}

// ==================== MENU CATEGORY ====================

export interface MenuCategoryProps {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class MenuCategory {
  private constructor(private props: MenuCategoryProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get displayOrder(): number { return this.props.displayOrder; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  static create(props: Omit<MenuCategoryProps, "createdAt" | "updatedAt" | "isActive"> & Partial<Pick<MenuCategoryProps, "createdAt" | "updatedAt" | "isActive">>): Result<MenuCategory, ValidationError> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Category name is required", "NAME_REQUIRED"));
    }
    return Result.ok(new MenuCategory({
      ...props,
      name: props.name.trim(),
      description: props.description?.trim(),
      isActive: props.isActive ?? true,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt,
    }));
  }
}

// ==================== MENU ITEM ====================

export type MenuItemType = "plato" | "bebida" | "postre" | "entrada";

export interface MenuItemProps {
  id: string;
  companyId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  type: MenuItemType;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime?: number; // minutes
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class MenuItem {
  private constructor(private props: MenuItemProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get categoryId(): string { return this.props.categoryId; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get price(): number { return this.props.price; }
  get type(): MenuItemType { return this.props.type; }
  get imageUrl(): string | undefined { return this.props.imageUrl; }
  get isAvailable(): boolean { return this.props.isAvailable; }
  get preparationTime(): number | undefined { return this.props.preparationTime; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  updatePrice(price: number): Result<void, ValidationError> {
    if (price < 0) {
      return Result.fail(new ValidationError("Price cannot be negative", "NEGATIVE_PRICE"));
    }
    this.props.price = price;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  markUnavailable(): void {
    this.props.isAvailable = false;
    this.props.updatedAt = new Date();
  }

  markAvailable(): void {
    this.props.isAvailable = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  static create(props: Omit<MenuItemProps, "createdAt" | "updatedAt" | "isActive" | "isAvailable"> & Partial<Pick<MenuItemProps, "createdAt" | "updatedAt" | "isActive" | "isAvailable">>): Result<MenuItem, ValidationError> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Item name is required", "NAME_REQUIRED"));
    }
    if (props.price < 0) {
      return Result.fail(new ValidationError("Price cannot be negative", "NEGATIVE_PRICE"));
    }
    return Result.ok(new MenuItem({
      ...props,
      name: props.name.trim(),
      description: props.description?.trim(),
      isAvailable: props.isAvailable ?? true,
      isActive: props.isActive ?? true,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt,
    }));
  }
}

// ==================== RESTAURANT ORDER ====================

export type OrderStatus = "pendiente" | "en_preparacion" | "servido" | "pagado" | "cancelado";
export type PaymentMethod = "efectivo" | "tarjeta" | "transferencia";

export interface RestaurantOrderProps {
  id: string;
  companyId: string;
  branchId?: string;
  tableId: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: PaymentMethod;
  paidAt?: Date;
  notes?: string;
  waiterId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class RestaurantOrder {
  private constructor(private props: RestaurantOrderProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get branchId(): string | undefined { return this.props.branchId; }
  get tableId(): string { return this.props.tableId; }
  get orderNumber(): string { return this.props.orderNumber; }
  get status(): OrderStatus { return this.props.status; }
  get subtotal(): number { return this.props.subtotal; }
  get tax(): number { return this.props.tax; }
  get total(): number { return this.props.total; }
  get paymentMethod(): PaymentMethod | undefined { return this.props.paymentMethod; }
  get paidAt(): Date | undefined { return this.props.paidAt; }
  get notes(): string | undefined { return this.props.notes; }
  get waiterId(): string | undefined { return this.props.waiterId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  calculateTotals(taxRate: number = 19): void {
    this.props.subtotal = this.props.subtotal;
    this.props.tax = this.props.subtotal * (taxRate / 100);
    this.props.total = this.props.subtotal + this.props.tax;
    this.props.updatedAt = new Date();
  }

  changeStatus(newStatus: OrderStatus): Result<void, ValidationError> {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pendiente: ["en_preparacion", "cancelado"],
      en_preparacion: ["servido"],
      servido: ["pagado"],
      pagado: [],
      cancelado: [],
    };

    if (this.props.status === newStatus) {
      return Result.ok(undefined);
    }

    const allowed = validTransitions[this.props.status];
    if (!allowed.includes(newStatus)) {
      return Result.fail(new ValidationError(`Invalid transition from ${this.props.status} to ${newStatus}`, "INVALID_TRANSITION"));
    }

    this.props.status = newStatus;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  markAsPaid(paymentMethod: PaymentMethod): void {
    this.props.paymentMethod = paymentMethod;
    this.props.paidAt = new Date();
    this.props.updatedAt = new Date();
  }

  isPaid(): boolean {
    return this.props.status === "pagado";
  }

  static create(props: Omit<RestaurantOrderProps, "createdAt" | "updatedAt" | "status" | "subtotal" | "tax" | "total"> & Partial<Pick<RestaurantOrderProps, "createdAt" | "updatedAt" | "status" | "subtotal" | "tax" | "total">>): Result<RestaurantOrder, ValidationError> {
    if (!props.tableId) {
      return Result.fail(new ValidationError("Table is required", "TABLE_REQUIRED"));
    }
    if (!props.orderNumber || props.orderNumber.trim().length === 0) {
      return Result.fail(new ValidationError("Order number is required", "ORDER_NUMBER_REQUIRED"));
    }
    return Result.ok(new RestaurantOrder({
      ...props,
      status: props.status ?? "pendiente",
      subtotal: props.subtotal ?? 0,
      tax: props.tax ?? 0,
      total: props.total ?? 0,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt,
    }));
  }
}

// ==================== ORDER ITEM ====================

export interface OrderItemProps {
  id: string;
  orderId: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export class OrderItem {
  private constructor(private props: OrderItemProps) {}

  get id(): string { return this.props.id; }
  get orderId(): string { return this.props.orderId; }
  get menuItemId(): string | undefined { return this.props.menuItemId; }
  get name(): string { return this.props.name; }
  get quantity(): number { return this.props.quantity; }
  get unitPrice(): number { return this.props.unitPrice; }
  get totalPrice(): number { return this.props.totalPrice; }
  get notes(): string | undefined { return this.props.notes; }

  updateQuantity(quantity: number): Result<void, ValidationError> {
    if (quantity <= 0) {
      return Result.fail(new ValidationError("Quantity must be greater than 0", "INVALID_QUANTITY"));
    }
    this.props.quantity = quantity;
    this.props.totalPrice = quantity * this.props.unitPrice;
    return Result.ok(undefined);
  }

  static create(props: Omit<OrderItemProps, "totalPrice"> & Partial<Pick<OrderItemProps, "totalPrice">>): Result<OrderItem, ValidationError> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Item name is required", "NAME_REQUIRED"));
    }
    if (props.quantity <= 0) {
      return Result.fail(new ValidationError("Quantity must be greater than 0", "INVALID_QUANTITY"));
    }
    if (props.unitPrice < 0) {
      return Result.fail(new ValidationError("Price cannot be negative", "NEGATIVE_PRICE"));
    }
    const totalPrice = props.quantity * props.unitPrice;
    return Result.ok(new OrderItem({
      ...props,
      name: props.name.trim(),
      notes: props.notes?.trim(),
      totalPrice,
    }));
  }
}

// ==================== INGREDIENT ====================

export type IngredientUnit = "kg" | "gr" | "lt" | "ml" | "un";

export interface IngredientProps {
  id: string;
  companyId: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: IngredientUnit;
  costPerUnit: number;
  supplierId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class Ingredient {
  private constructor(private props: IngredientProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get name(): string { return this.props.name; }
  get currentStock(): number { return this.props.currentStock; }
  get minStock(): number { return this.props.minStock; }
  get unit(): IngredientUnit { return this.props.unit; }
  get costPerUnit(): number { return this.props.costPerUnit; }
  get supplierId(): string | undefined { return this.props.supplierId; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  isLowStock(): boolean {
    return this.props.currentStock <= this.props.minStock;
  }

  isOutOfStock(): boolean {
    return this.props.currentStock === 0;
  }

  updateStock(quantity: number, direction: "IN" | "OUT"): Result<void, ValidationError> {
    if (direction === "OUT" && quantity > this.props.currentStock) {
      return Result.fail(new ValidationError("Insufficient stock", "INSUFFICIENT_STOCK"));
    }
    this.props.currentStock += direction === "IN" ? quantity : -quantity;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  updateCostPerUnit(cost: number): Result<void, ValidationError> {
    if (cost < 0) {
      return Result.fail(new ValidationError("Cost cannot be negative", "NEGATIVE_COST"));
    }
    this.props.costPerUnit = cost;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  static create(props: Omit<IngredientProps, "createdAt" | "updatedAt" | "isActive"> & Partial<Pick<IngredientProps, "createdAt" | "updatedAt" | "isActive">>): Result<Ingredient, ValidationError> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Ingredient name is required", "NAME_REQUIRED"));
    }
    if (props.currentStock < 0) {
      return Result.fail(new ValidationError("Stock cannot be negative", "NEGATIVE_STOCK"));
    }
    if (props.costPerUnit < 0) {
      return Result.fail(new ValidationError("Cost cannot be negative", "NEGATIVE_COST"));
    }
    return Result.ok(new Ingredient({
      ...props,
      name: props.name.trim(),
      isActive: props.isActive ?? true,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt,
    }));
  }
}

// ==================== RECIPE ====================

export interface RecipeIngredientProps {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: IngredientUnit;
}

export interface RecipeProps {
  id: string;
  companyId: string;
  menuItemId: string;
  name: string;
  ingredients: RecipeIngredientProps[];
  laborTime?: number; // minutes
  laborCost?: number;
  totalCost: number;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class Recipe {
  private constructor(private props: RecipeProps) {}

  get id(): string { return this.props.id; }
  get companyId(): string { return this.props.companyId; }
  get menuItemId(): string { return this.props.menuItemId; }
  get name(): string { return this.props.name; }
  get ingredients(): RecipeIngredientProps[] { return this.props.ingredients; }
  get laborTime(): number | undefined { return this.props.laborTime; }
  get laborCost(): number | undefined { return this.props.laborCost; }
  get totalCost(): number { return this.props.totalCost; }
  get notes(): string | undefined { return this.props.notes; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  calculateCost(): number {
    const ingredientsCost = this.props.ingredients.reduce((sum, ing) => {
      return sum + (ing.quantity * 0); // Would need to fetch ingredient costs
    }, 0);
    return ingredientsCost + (this.props.laborCost ?? 0);
  }

  canPrepare(stock: Record<string, number>): boolean {
    for (const ingredient of this.props.ingredients) {
      const available = stock[ingredient.ingredientId] ?? 0;
      if (available < ingredient.quantity) {
        return false;
      }
    }
    return true;
  }

  updateNotes(notes: string): void {
    this.props.notes = notes;
    this.props.updatedAt = new Date();
  }

  static create(props: Omit<RecipeProps, "createdAt" | "updatedAt"> & Partial<Pick<RecipeProps, "createdAt" | "updatedAt">>): Result<Recipe, ValidationError> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError("Recipe name is required", "NAME_REQUIRED"));
    }
    if (props.ingredients.length === 0) {
      return Result.fail(new ValidationError("Recipe must have ingredients", "NO_INGREDIENTS"));
    }
    if (props.totalCost < 0) {
      return Result.fail(new ValidationError("Total cost cannot be negative", "NEGATIVE_COST"));
    }
    return Result.ok(new Recipe({
      ...props,
      name: props.name.trim(),
      notes: props.notes?.trim(),
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt,
    }));
  }
}
