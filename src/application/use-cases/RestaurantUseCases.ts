/**
 * Restaurant DTOs and Use Cases
 */

import { Result, ValidationError, RepositoryError, UnexpectedError } from "@/shared/kernel";
import type { ITableRepository, IMenuCategoryRepository, IMenuItemRepository, IRestaurantOrderRepository, IIngredientRepository, IRecipeRepository } from "@/domain/repositories/IRestaurantRepository";
import type { TableStatus, OrderStatus, PaymentMethod, MenuItemType, IngredientUnit } from "@/domain/entities/Restaurant";
import { TableEntity, MenuCategory, MenuItem, RestaurantOrder, OrderItem, Ingredient, Recipe } from "@/domain/entities/Restaurant";

type UseCaseError = ValidationError | RepositoryError | UnexpectedError;

// ==================== DTOs ====================

export interface CreateTableDTO {
  companyId: string;
  branchId?: string;
  tableNumber: string;
  capacity: number;
  location?: string;
}

export interface CreateMenuItemDTO {
  companyId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  type: MenuItemType;
  preparationTime?: number;
}

export interface CreateRestaurantOrderDTO {
  companyId: string;
  branchId?: string;
  tableId: string;
  waiterId?: string;
  notes?: string;
}

export interface CreateIngredientDTO {
  companyId: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: IngredientUnit;
  costPerUnit: number;
  supplierId?: string;
}

export interface CreateRecipeDTO {
  companyId: string;
  menuItemId: string;
  name: string;
  ingredients: Array<{ ingredientId: string; ingredientName: string; quantity: number; unit: IngredientUnit }>;
  laborTime?: number;
  laborCost?: number;
  totalCost: number;
  notes?: string;
}

// ==================== CREATE TABLE USE CASE ====================

export class CreateTableUseCase {
  constructor(private readonly tableRepository: ITableRepository) {}

  async execute(input: CreateTableDTO): Promise<Result<any, UseCaseError>> {
    try {
      const tableResult = TableEntity.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        branchId: input.branchId,
        tableNumber: input.tableNumber,
        capacity: input.capacity,
        location: input.location,
      });

      if (tableResult.isFailure) {
        return Result.fail(tableResult.getError());
      }

      const table = tableResult.getValue();
      const saveResult = await this.tableRepository.create(table);

      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      const savedTable = saveResult.getValue();
      return Result.ok({
        id: savedTable.id,
        tableNumber: savedTable.tableNumber,
        capacity: savedTable.capacity,
        status: savedTable.status,
      });
    } catch (error) {
      return Result.fail(new UnexpectedError("Error creating table", { originalError: error }));
    }
  }
}

// ==================== CREATE MENU ITEM USE CASE ====================

export class CreateMenuItemUseCase {
  constructor(private readonly menuItemRepository: IMenuItemRepository) {}

  async execute(input: CreateMenuItemDTO): Promise<Result<any, UseCaseError>> {
    try {
      const itemResult = MenuItem.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        categoryId: input.categoryId,
        name: input.name,
        description: input.description,
        price: input.price,
        type: input.type,
        preparationTime: input.preparationTime,
      });

      if (itemResult.isFailure) {
        return Result.fail(itemResult.getError());
      }

      const item = itemResult.getValue();
      const saveResult = await this.menuItemRepository.create(item);

      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      const savedItem = saveResult.getValue();
      return Result.ok({
        id: savedItem.id,
        name: savedItem.name,
        price: savedItem.price,
        type: savedItem.type,
      });
    } catch (error) {
      return Result.fail(new UnexpectedError("Error creating menu item", { originalError: error }));
    }
  }
}

// ==================== CREATE RESTAURANT ORDER USE CASE ====================

export class CreateRestaurantOrderUseCase {
  constructor(private readonly orderRepository: IRestaurantOrderRepository) {}

  async execute(input: CreateRestaurantOrderDTO): Promise<Result<any, UseCaseError>> {
    try {
      const orderNumberResult = await this.orderRepository.getNextOrderNumber(input.companyId);
      if (orderNumberResult.isFailure) {
        return Result.fail(orderNumberResult.getError());
      }
      const orderNumber = orderNumberResult.getValue();

      const orderResult = RestaurantOrder.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        branchId: input.branchId,
        tableId: input.tableId,
        orderNumber,
        waiterId: input.waiterId,
        notes: input.notes,
      });

      if (orderResult.isFailure) {
        return Result.fail(orderResult.getError());
      }

      const order = orderResult.getValue();
      const saveResult = await this.orderRepository.create(order);

      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      const savedOrder = saveResult.getValue();
      return Result.ok({
        id: savedOrder.id,
        orderNumber: savedOrder.orderNumber,
        tableId: savedOrder.tableId,
        status: savedOrder.status,
      });
    } catch (error) {
      return Result.fail(new UnexpectedError("Error creating order", { originalError: error }));
    }
  }
}

// ==================== UPDATE INGREDIENT STOCK USE CASE ====================

export class UpdateIngredientStockUseCase {
  constructor(private readonly ingredientRepository: IIngredientRepository) {}

  async execute(ingredientId: string, quantity: number, direction: "IN" | "OUT"): Promise<Result<any, UseCaseError>> {
    try {
      const fetchResult = await this.ingredientRepository.findById(ingredientId);
      if (fetchResult.isFailure) {
        return Result.fail(fetchResult.getError());
      }

      let ingredient = fetchResult.getValue();
      const stockResult = ingredient.updateStock(quantity, direction);

      if (stockResult.isFailure) {
        return Result.fail(stockResult.getError());
      }

      const saveResult = await this.ingredientRepository.update(ingredient);
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      return Result.ok({
        id: ingredient.id,
        name: ingredient.name,
        currentStock: ingredient.currentStock,
      });
    } catch (error) {
      return Result.fail(new UnexpectedError("Error updating ingredient stock", { originalError: error }));
    }
  }
}

// ==================== CREATE RECIPE USE CASE ====================

export class CreateRecipeUseCase {
  constructor(private readonly recipeRepository: IRecipeRepository) {}

  async execute(input: CreateRecipeDTO): Promise<Result<any, UseCaseError>> {
    try {
      const recipeResult = Recipe.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        menuItemId: input.menuItemId,
        name: input.name,
        ingredients: input.ingredients,
        laborTime: input.laborTime,
        laborCost: input.laborCost,
        totalCost: input.totalCost,
        notes: input.notes,
      });

      if (recipeResult.isFailure) {
        return Result.fail(recipeResult.getError());
      }

      const recipe = recipeResult.getValue();
      const saveResult = await this.recipeRepository.create(recipe);

      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      const savedRecipe = saveResult.getValue();
      return Result.ok({
        id: savedRecipe.id,
        name: savedRecipe.name,
        totalCost: savedRecipe.totalCost,
      });
    } catch (error) {
      return Result.fail(new UnexpectedError("Error creating recipe", { originalError: error }));
    }
  }
}
