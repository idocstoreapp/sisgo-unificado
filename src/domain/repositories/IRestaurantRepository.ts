/**
 * Restaurant repository interfaces
 */

import { Result } from "@/shared/kernel";
import type { TableEntity, MenuCategory, MenuItem, RestaurantOrder, OrderItem, Ingredient, Recipe } from "@/entities/Restaurant";
import type { TableStatus, OrderStatus } from "@/entities/Restaurant";
import type { RepositoryError, NotFoundError } from "@/shared/kernel/errors";

// ==================== TABLE REPOSITORY ====================

export interface TableFilters {
  status?: TableStatus;
  location?: string;
}

export interface ITableRepository {
  findById(id: string): Promise<Result<TableEntity, NotFoundError | RepositoryError>>;
  findByCompany(companyId: string, filters?: TableFilters): Promise<Result<TableEntity[], RepositoryError>>;
  findByBranch(branchId: string): Promise<Result<TableEntity[], RepositoryError>>;
  findByStatus(companyId: string, status: TableStatus): Promise<Result<TableEntity[], RepositoryError>>;
  create(table: TableEntity): Promise<Result<TableEntity, RepositoryError>>;
  update(table: TableEntity): Promise<Result<TableEntity, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}

// ==================== MENU CATEGORY REPOSITORY ====================

export interface IMenuCategoryRepository {
  findById(id: string): Promise<Result<MenuCategory, NotFoundError | RepositoryError>>;
  findByCompany(companyId: string): Promise<Result<MenuCategory[], RepositoryError>>;
  create(category: MenuCategory): Promise<Result<MenuCategory, RepositoryError>>;
  update(category: MenuCategory): Promise<Result<MenuCategory, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}

// ==================== MENU ITEM REPOSITORY ====================

export interface MenuItemFilters {
  categoryId?: string;
  type?: string;
  isAvailable?: boolean;
}

export interface IMenuItemRepository {
  findById(id: string): Promise<Result<MenuItem, NotFoundError | RepositoryError>>;
  findByCompany(companyId: string, filters?: MenuItemFilters): Promise<Result<MenuItem[], RepositoryError>>;
  findByCategory(categoryId: string): Promise<Result<MenuItem[], RepositoryError>>;
  create(item: MenuItem): Promise<Result<MenuItem, RepositoryError>>;
  update(item: MenuItem): Promise<Result<MenuItem, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}

// ==================== RESTAURANT ORDER REPOSITORY ====================

export interface OrderFilters {
  status?: OrderStatus;
  tableId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface IRestaurantOrderRepository {
  findById(id: string): Promise<Result<RestaurantOrder, NotFoundError | RepositoryError>>;
  findByOrderNumber(orderNumber: string, companyId: string): Promise<Result<RestaurantOrder | null, RepositoryError>>;
  findByCompany(companyId: string, filters?: OrderFilters): Promise<Result<RestaurantOrder[], RepositoryError>>;
  findByTable(tableId: string): Promise<Result<RestaurantOrder[], RepositoryError>>;
  countByStatus(companyId: string, status: OrderStatus): Promise<Result<number, RepositoryError>>;
  create(order: RestaurantOrder): Promise<Result<RestaurantOrder, RepositoryError>>;
  update(order: RestaurantOrder): Promise<Result<RestaurantOrder, RepositoryError>>;
  getNextOrderNumber(companyId: string): Promise<Result<string, RepositoryError>>;
}

// ==================== ORDER ITEM REPOSITORY ====================

export interface IOrderItemRepository {
  findById(id: string): Promise<Result<OrderItem, NotFoundError | RepositoryError>>;
  findByOrder(orderId: string): Promise<Result<OrderItem[], RepositoryError>>;
  create(item: OrderItem): Promise<Result<OrderItem, RepositoryError>>;
  update(item: OrderItem): Promise<Result<OrderItem, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}

// ==================== INGREDIENT REPOSITORY ====================

export interface IngredientFilters {
  search?: string;
  lowStock?: boolean;
}

export interface IIngredientRepository {
  findById(id: string): Promise<Result<Ingredient, NotFoundError | RepositoryError>>;
  findByCompany(companyId: string, filters?: IngredientFilters): Promise<Result<Ingredient[], RepositoryError>>;
  findLowStock(companyId: string): Promise<Result<Ingredient[], RepositoryError>>;
  create(ingredient: Ingredient): Promise<Result<Ingredient, RepositoryError>>;
  update(ingredient: Ingredient): Promise<Result<Ingredient, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}

// ==================== RECIPE REPOSITORY ====================

export interface IRecipeRepository {
  findById(id: string): Promise<Result<Recipe, NotFoundError | RepositoryError>>;
  findByMenuItem(menuItemId: string): Promise<Result<Recipe | null, RepositoryError>>;
  findByCompany(companyId: string): Promise<Result<Recipe[], RepositoryError>>;
  create(recipe: Recipe): Promise<Result<Recipe, RepositoryError>>;
  update(recipe: Recipe): Promise<Result<Recipe, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
