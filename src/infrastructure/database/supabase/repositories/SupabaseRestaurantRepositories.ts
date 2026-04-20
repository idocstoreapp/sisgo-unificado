/**
 * Supabase implementations for restaurant repositories
 */

import { Result, NotFoundError, RepositoryError } from "@/shared/kernel";
import type { Database } from "@/infrastructure/database/supabase/database.types";
import type {
  TableEntity,
  MenuCategory,
  MenuItem,
  RestaurantOrder,
  OrderItem,
  Ingredient,
  Recipe,
} from "@/domain/entities/Restaurant";
import type {
  ITableRepository,
  IMenuCategoryRepository,
  IMenuItemRepository,
  IRestaurantOrderRepository,
  IOrderItemRepository,
  IIngredientRepository,
  IRecipeRepository,
  TableFilters,
  MenuItemFilters,
  OrderFilters,
  IngredientFilters,
} from "@/domain/repositories/IRestaurantRepository";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";

// ==================== TABLE REPOSITORY ====================

export class SupabaseTableRepository implements ITableRepository {
  async findById(id: string): Promise<Result<TableEntity, NotFoundError | RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("restaurant_tables").select("*").eq("id", id).single();

      if (error) {
        if (error.code === "PGRST116") return Result.fail(new NotFoundError("Table not found"));
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string, filters?: TableFilters): Promise<Result<TableEntity[], RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      let query = supabase.from("restaurant_tables").select("*").eq("company_id", companyId);

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.location) query = query.eq("location", filters.location);

      const { data, error } = await query;

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map((t) => this.toEntity(t)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByBranch(branchId: string): Promise<Result<TableEntity[], RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("restaurant_tables").select("*").eq("branch_id", branchId);

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map((t) => this.toEntity(t)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByStatus(companyId: string, status: string): Promise<Result<TableEntity[], RepositoryError>> {
    return this.findByCompany(companyId, { status });
  }

  async create(table: TableEntity): Promise<Result<TableEntity, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("restaurant_tables").insert(this.toInsert(table)).select().single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(table: TableEntity): Promise<Result<TableEntity, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("restaurant_tables")
        .update(this.toUpdate(table))
        .eq("id", table.id)
        .select()
        .single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(data: any): TableEntity {
    return new TableEntity({
      id: data.id,
      companyId: data.company_id,
      branchId: data.branch_id,
      name: data.name,
      capacity: data.capacity,
      status: data.status || "available",
      location: data.location,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  private toInsert(entity: TableEntity): any {
    return {
      company_id: entity.companyId,
      branch_id: entity.branchId,
      name: entity.name,
      capacity: entity.capacity,
      status: entity.status,
      location: entity.location,
    };
  }

  private toUpdate(entity: TableEntity): any {
    return {
      name: entity.name,
      capacity: entity.capacity,
      status: entity.status,
      location: entity.location,
      updated_at: new Date().toISOString(),
    };
  }
}

// ==================== MENU CATEGORY REPOSITORY ====================

export class SupabaseMenuCategoryRepository implements IMenuCategoryRepository {
  async findById(id: string): Promise<Result<MenuCategory, NotFoundError | RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("menu_categories").select("*").eq("id", id).single();

      if (error) {
        if (error.code === "PGRST116") return Result.fail(new NotFoundError("Category not found"));
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string): Promise<Result<MenuCategory[], RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("menu_categories").select("*").eq("company_id", companyId).order("name");

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map((c) => this.toEntity(c)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(category: MenuCategory): Promise<Result<MenuCategory, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("menu_categories").insert(this.toInsert(category)).select().single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(category: MenuCategory): Promise<Result<MenuCategory, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("menu_categories")
        .update(this.toUpdate(category))
        .eq("id", category.id)
        .select()
        .single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("menu_categories").delete().eq("id", id);

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(data: any): MenuCategory {
    return new MenuCategory({
      id: data.id,
      companyId: data.company_id,
      name: data.name,
      description: data.description,
      sortOrder: data.sort_order || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  private toInsert(entity: MenuCategory): any {
    return {
      company_id: entity.companyId,
      name: entity.name,
      description: entity.description,
      sort_order: entity.sortOrder,
    };
  }

  private toUpdate(entity: MenuCategory): any {
    return {
      name: entity.name,
      description: entity.description,
      sort_order: entity.sortOrder,
      updated_at: new Date().toISOString(),
    };
  }
}

// ==================== MENU ITEM REPOSITORY ====================

export class SupabaseMenuItemRepository implements IMenuItemRepository {
  async findById(id: string): Promise<Result<MenuItem, NotFoundError | RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("menu_items").select("*").eq("id", id).single();

      if (error) {
        if (error.code === "PGRST116") return Result.fail(new NotFoundError("Menu item not found"));
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string, filters?: MenuItemFilters): Promise<Result<MenuItem[], RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      let query = supabase.from("menu_items").select("*").eq("company_id", companyId);

      if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
      if (filters?.type) query = query.eq("type", filters.type);
      if (filters?.isAvailable !== undefined) query = query.eq("is_available", filters.isAvailable);

      const { data, error } = await query;

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map((item) => this.toEntity(item)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCategory(categoryId: string): Promise<Result<MenuItem[], RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("menu_items").select("*").eq("category_id", categoryId).order("name");

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map((item) => this.toEntity(item)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(item: MenuItem): Promise<Result<MenuItem, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("menu_items").insert(this.toInsert(item)).select().single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(item: MenuItem): Promise<Result<MenuItem, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("menu_items")
        .update(this.toUpdate(item))
        .eq("id", item.id)
        .select()
        .single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("menu_items").delete().eq("id", id);

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(data: any): MenuItem {
    return new MenuItem({
      id: data.id,
      companyId: data.company_id,
      categoryId: data.category_id,
      name: data.name,
      description: data.description,
      price: parseFloat(data.price || "0"),
      type: data.type || "plato",
      isAvailable: data.is_available ?? true,
      imageUrl: data.image_url,
      preparationTime: data.preparation_time,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  private toInsert(entity: MenuItem): any {
    return {
      company_id: entity.companyId,
      category_id: entity.categoryId,
      name: entity.name,
      description: entity.description,
      price: entity.price.toString(),
      type: entity.type,
      is_available: entity.isAvailable,
      image_url: entity.imageUrl,
      preparation_time: entity.preparationTime,
    };
  }

  private toUpdate(entity: MenuItem): any {
    return {
      category_id: entity.categoryId,
      name: entity.name,
      description: entity.description,
      price: entity.price.toString(),
      type: entity.type,
      is_available: entity.isAvailable,
      image_url: entity.imageUrl,
      preparation_time: entity.preparationTime,
      updated_at: new Date().toISOString(),
    };
  }
}

// ==================== RESTAURANT ORDER REPOSITORY ====================

export class SupabaseRestaurantOrderRepository implements IRestaurantOrderRepository {
  async findById(id: string): Promise<Result<RestaurantOrder, NotFoundError | RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("restaurant_orders").select("*, items:order_items(*)").eq("id", id).single();

      if (error) {
        if (error.code === "PGRST116") return Result.fail(new NotFoundError("Order not found"));
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByOrderNumber(orderNumber: string, companyId: string): Promise<Result<RestaurantOrder | null, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("restaurant_orders")
        .select("*, items:order_items(*)")
        .eq("order_number", orderNumber)
        .eq("company_id", companyId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return Result.ok(null);
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(data ? this.toEntity(data) : null);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string, filters?: OrderFilters): Promise<Result<RestaurantOrder[], RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      let query = supabase.from("restaurant_orders").select("*, items:order_items(*)").eq("company_id", companyId);

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.tableId) query = query.eq("table_id", filters.tableId);
      if (filters?.dateFrom) query = query.gte("created_at", filters.dateFrom.toISOString());
      if (filters?.dateTo) query = query.lte("created_at", filters.dateTo.toISOString());

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map((o) => this.toEntity(o)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByTable(tableId: string): Promise<Result<RestaurantOrder[], RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("restaurant_orders")
        .select("*, items:order_items(*)")
        .eq("table_id", tableId)
        .order("created_at", { ascending: false });

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map((o) => this.toEntity(o)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async countByStatus(companyId: string, status: string): Promise<Result<number, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("restaurant_orders")
        .select("id", { count: "exact" })
        .eq("company_id", companyId)
        .eq("status", status);

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(data?.length || 0);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(order: RestaurantOrder): Promise<Result<RestaurantOrder, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("restaurant_orders").insert(this.toInsert(order)).select().single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(order: RestaurantOrder): Promise<Result<RestaurantOrder, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("restaurant_orders")
        .update(this.toUpdate(order))
        .eq("id", order.id)
        .select()
        .single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async getNextOrderNumber(companyId: string): Promise<Result<string, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const year = new Date().getFullYear();
      const { data, error } = await supabase
        .from("restaurant_orders")
        .select("order_number")
        .eq("company_id", companyId)
        .ilike("order_number", `%${year}%`)
        .order("order_number", { ascending: false })
        .limit(1);

      if (error) return Result.fail(new RepositoryError(error.message, error.code));

      const lastNumber = data?.[0]?.order_number;
      let nextNumber = 1;

      if (lastNumber) {
        const match = lastNumber.match(/-(\d+)$/);
        if (match) nextNumber = parseInt(match[1]) + 1;
      }

      return Result.ok(`RO-${year}-${String(nextNumber).padStart(4, "0")}`);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(data: any): RestaurantOrder {
    const items = (data.items || []).map((item: any) =>
      new OrderItem({
        id: item.id,
        orderId: item.order_id,
        menuItemId: item.menu_item_id,
        name: item.name,
        quantity: item.quantity || 1,
        unitPrice: parseFloat(item.unit_price || "0"),
        totalPrice: parseFloat(item.total_price || "0"),
        notes: item.notes,
        status: item.status || "pending",
        createdAt: new Date(item.created_at),
      })
    );

    return new RestaurantOrder({
      id: data.id,
      companyId: data.company_id,
      branchId: data.branch_id,
      tableId: data.table_id,
      orderNumber: data.order_number,
      items,
      status: data.status || "pending",
      subtotal: parseFloat(data.subtotal || "0"),
      tax: parseFloat(data.tax || "0"),
      total: parseFloat(data.total || "0"),
      notes: data.notes,
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  private toInsert(entity: RestaurantOrder): any {
    return {
      company_id: entity.companyId,
      branch_id: entity.branchId,
      table_id: entity.tableId,
      order_number: entity.orderNumber,
      status: entity.status,
      subtotal: entity.subtotal.toString(),
      tax: entity.tax.toString(),
      total: entity.total.toString(),
      notes: entity.notes,
      paid_at: entity.paidAt?.toISOString(),
    };
  }

  private toUpdate(entity: RestaurantOrder): any {
    return {
      status: entity.status,
      subtotal: entity.subtotal.toString(),
      tax: entity.tax.toString(),
      total: entity.total.toString(),
      notes: entity.notes,
      paid_at: entity.paidAt?.toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

// ==================== ORDER ITEM REPOSITORY ====================

export class SupabaseOrderItemRepository implements IOrderItemRepository {
  async findById(id: string): Promise<Result<OrderItem, NotFoundError | RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("order_items").select("*").eq("id", id).single();

      if (error) {
        if (error.code === "PGRST116") return Result.fail(new NotFoundError("Item not found"));
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByOrder(orderId: string): Promise<Result<OrderItem[], RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", orderId).order("created_at");

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map((item) => this.toEntity(item)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(item: OrderItem): Promise<Result<OrderItem, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("order_items").insert(this.toInsert(item)).select().single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(item: OrderItem): Promise<Result<OrderItem, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("order_items")
        .update(this.toUpdate(item))
        .eq("id", item.id)
        .select()
        .single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("order_items").delete().eq("id", id);

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(data: any): OrderItem {
    return new OrderItem({
      id: data.id,
      orderId: data.order_id,
      menuItemId: data.menu_item_id,
      name: data.name,
      quantity: data.quantity || 1,
      unitPrice: parseFloat(data.unit_price || "0"),
      totalPrice: parseFloat(data.total_price || "0"),
      notes: data.notes,
      status: data.status || "pending",
      createdAt: new Date(data.created_at),
    });
  }

  private toInsert(entity: OrderItem): any {
    return {
      order_id: entity.orderId,
      menu_item_id: entity.menuItemId,
      name: entity.name,
      quantity: entity.quantity,
      unit_price: entity.unitPrice.toString(),
      total_price: entity.totalPrice.toString(),
      notes: entity.notes,
      status: entity.status,
    };
  }

  private toUpdate(entity: OrderItem): any {
    return {
      quantity: entity.quantity,
      unit_price: entity.unitPrice.toString(),
      total_price: entity.totalPrice.toString(),
      notes: entity.notes,
      status: entity.status,
      updated_at: new Date().toISOString(),
    };
  }
}

// ==================== INGREDIENT REPOSITORY ====================

export class SupabaseIngredientRepository implements IIngredientRepository {
  async findById(id: string): Promise<Result<Ingredient, NotFoundError | RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("ingredients").select("*").eq("id", id).single();

      if (error) {
        if (error.code === "PGRST116") return Result.fail(new NotFoundError("Ingredient not found"));
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string, filters?: IngredientFilters): Promise<Result<Ingredient[], RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      let query = supabase.from("ingredients").select("*").eq("company_id", companyId);

      if (filters?.search) query = query.ilike("name", `%${filters.search}%`);
      if (filters?.lowStock) query = query.lt("stock_current", "stock_min");

      const { data, error } = await query.order("name");

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map((ing) => this.toEntity(ing)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findLowStock(companyId: string): Promise<Result<Ingredient[], RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .eq("company_id", companyId)
        .lt("stock_current", "stock_min")
        .order("name");

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map((ing) => this.toEntity(ing)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(ingredient: Ingredient): Promise<Result<Ingredient, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("ingredients").insert(this.toInsert(ingredient)).select().single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(ingredient: Ingredient): Promise<Result<Ingredient, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("ingredients")
        .update(this.toUpdate(ingredient))
        .eq("id", ingredient.id)
        .select()
        .single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("ingredients").delete().eq("id", id);

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(data: any): Ingredient {
    return new Ingredient({
      id: data.id,
      companyId: data.company_id,
      name: data.name,
      unit: data.unit || "un",
      stockCurrent: parseFloat(data.stock_current || "0"),
      stockMin: parseFloat(data.stock_min || "5"),
      costPrice: parseFloat(data.cost_price || "0"),
      supplierId: data.supplier_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  private toInsert(entity: Ingredient): any {
    return {
      company_id: entity.companyId,
      name: entity.name,
      unit: entity.unit,
      stock_current: entity.stockCurrent,
      stock_min: entity.stockMin,
      cost_price: entity.costPrice.toString(),
      supplier_id: entity.supplierId,
    };
  }

  private toUpdate(entity: Ingredient): any {
    return {
      name: entity.name,
      unit: entity.unit,
      stock_current: entity.stockCurrent,
      stock_min: entity.stockMin,
      cost_price: entity.costPrice.toString(),
      supplier_id: entity.supplierId,
      updated_at: new Date().toISOString(),
    };
  }
}

// ==================== RECIPE REPOSITORY ====================

export class SupabaseRecipeRepository implements IRecipeRepository {
  async findById(id: string): Promise<Result<Recipe, NotFoundError | RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("recipes").select("*, ingredients:recipe_ingredients(*)").eq("id", id).single();

      if (error) {
        if (error.code === "PGRST116") return Result.fail(new NotFoundError("Recipe not found"));
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByMenuItem(menuItemId: string): Promise<Result<Recipe | null, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("recipes")
        .select("*, ingredients:recipe_ingredients(*)")
        .eq("menu_item_id", menuItemId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return Result.ok(null);
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(data ? this.toEntity(data) : null);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string): Promise<Result<Recipe[], RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("recipes")
        .select("*, ingredients:recipe_ingredients(*)")
        .eq("company_id", companyId)
        .order("name");

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok((data ?? []).map((r) => this.toEntity(r)));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(recipe: Recipe): Promise<Result<Recipe, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("recipes").insert(this.toInsert(recipe)).select().single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(recipe: Recipe): Promise<Result<Recipe, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("recipes")
        .update(this.toUpdate(recipe))
        .eq("id", recipe.id)
        .select()
        .single();

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(this.toEntity(data!));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("recipes").delete().eq("id", id);

      if (error) return Result.fail(new RepositoryError(error.message, error.code));
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(data: any): Recipe {
    return new Recipe({
      id: data.id,
      companyId: data.company_id,
      menuItemId: data.menu_item_id,
      name: data.name,
      description: data.description,
      ingredients: data.ingredients || [],
      costPerUnit: parseFloat(data.cost_per_unit || "0"),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  private toInsert(entity: Recipe): any {
    return {
      company_id: entity.companyId,
      menu_item_id: entity.menuItemId,
      name: entity.name,
      description: entity.description,
      cost_per_unit: entity.costPerUnit.toString(),
    };
  }

  private toUpdate(entity: Recipe): any {
    return {
      menu_item_id: entity.menuItemId,
      name: entity.name,
      description: entity.description,
      cost_per_unit: entity.costPerUnit.toString(),
      updated_at: new Date().toISOString(),
    };
  }
}
