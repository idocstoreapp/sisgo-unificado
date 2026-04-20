/**
 * Supabase implementations for inventory repositories
 */

import { Result, NotFoundError, RepositoryError } from "@/shared/kernel";
import type { IProductRepository, ProductFilters } from "@/domain/repositories/IProductRepository";
import type { Product } from "@/domain/entities/Product";
import type {
  IStockMovementRepository,
  StockMovementFilters,
  ISupplierRepository,
  SupplierFilters,
  IPurchaseRepository,
  PurchaseFilters,
} from "@/domain/repositories/IInventoryRepository";
import type { StockMovement, Supplier, Purchase } from "@/domain/entities/Inventory";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";
import type { Database } from "@/infrastructure/database/supabase/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type StockMovementRow = Database["public"]["Tables"]["stock_movements"]["Row"];
type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];
type PurchaseRow = Database["public"]["Tables"]["purchases"]["Row"];

// ==================== PRODUCT REPOSITORY ====================

export class SupabaseProductRepository implements IProductRepository {
  async findById(id: string): Promise<Result<Product, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.fail(new NotFoundError("Product not found"));
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      if (!data) {
        return Result.fail(new NotFoundError("Product not found"));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching product", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByBarcode(barcode: string, companyId: string): Promise<Result<Product | null, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("barcode", barcode)
        .eq("company_id", companyId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.ok(null);
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(data ? this.toEntity(data) : null);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching product by barcode", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string, filters?: ProductFilters): Promise<Result<Product[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      let query = supabase
        .from("products")
        .select("*")
        .eq("company_id", companyId);

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.type) {
        query = query.eq("type", filters.type);
      }
      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }
      if (filters?.barcode) {
        query = query.eq("barcode", filters.barcode);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive);
      }

      const { data, error } = await query.order("name");

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const products = (data || []).map((row) => this.toEntity(row));
      return Result.ok(products);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching products", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCategory(companyId: string, category: string): Promise<Result<Product[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("company_id", companyId)
        .eq("category", category)
        .order("name");

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const products = (data || []).map((row) => this.toEntity(row));
      return Result.ok(products);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching products by category", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findLowStock(companyId: string): Promise<Result<Product[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("company_id", companyId)
        .lte("stock", supabase.raw("min_stock"))
        .order("name");

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const products = (data || []).map((row) => this.toEntity(row));
      return Result.ok(products);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching low stock products", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(product: Product): Promise<Result<Product, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const insertData = this.toInsert(product);
      const { data, error } = await supabase
        .from("products")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while creating product", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(product: Product): Promise<Result<Product, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const updateData = this.toUpdate(product);
      const { data, error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", product.id)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while updating product", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while deleting product", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(row: ProductRow): Product {
    return new Product({
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      description: row.description ?? undefined,
      category: row.category ?? undefined,
      type: row.type as Product["type"],
      barcode: row.barcode ?? undefined,
      costPrice: Number(row.cost_price),
      salePrice: Number(row.sale_price),
      stock: Number(row.stock),
      minStock: Number(row.min_stock),
      unitType: row.unit_type as Product["unitType"],
      imageUrl: row.image_url ?? undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    });
  }

  private toInsert(product: Product): Database["public"]["Tables"]["products"]["Insert"] {
    return {
      id: product.id,
      company_id: product.companyId,
      name: product.name,
      description: product.description ?? null,
      category: product.category ?? null,
      type: product.type,
      barcode: product.barcode ?? null,
      cost_price: product.costPrice,
      sale_price: product.salePrice,
      stock: product.stock,
      min_stock: product.minStock,
      unit_type: product.unitType,
      image_url: product.imageUrl ?? null,
      is_active: product.isActive,
    };
  }

  private toUpdate(product: Product): Database["public"]["Tables"]["products"]["Update"] {
    return {
      name: product.name,
      description: product.description ?? null,
      category: product.category ?? null,
      type: product.type,
      barcode: product.barcode ?? null,
      cost_price: product.costPrice,
      sale_price: product.salePrice,
      stock: product.stock,
      min_stock: product.minStock,
      unit_type: product.unitType,
      image_url: product.imageUrl ?? null,
      is_active: product.isActive,
      updated_at: product.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}

// ==================== STOCK MOVEMENT REPOSITORY ====================

export class SupabaseStockMovementRepository implements IStockMovementRepository {
  async findById(id: string): Promise<Result<StockMovement, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("stock_movements")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      if (!data) {
        return Result.fail(new NotFoundError("Stock movement not found"));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching stock movement", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByProduct(productId: string): Promise<Result<StockMovement[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("stock_movements")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const movements = (data || []).map((row) => this.toEntity(row));
      return Result.ok(movements);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching stock movements", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string, filters?: StockMovementFilters): Promise<Result<StockMovement[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      let query = supabase
        .from("stock_movements")
        .select("*")
        .eq("company_id", companyId);

      if (filters?.productId) {
        query = query.eq("product_id", filters.productId);
      }
      if (filters?.reason) {
        query = query.eq("reason", filters.reason);
      }
      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo.toISOString());
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const movements = (data || []).map((row) => this.toEntity(row));
      return Result.ok(movements);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching stock movements", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByReason(companyId: string, reason: StockMovement["reason"]): Promise<Result<StockMovement[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("stock_movements")
        .select("*")
        .eq("company_id", companyId)
        .eq("reason", reason)
        .order("created_at", { ascending: false });

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const movements = (data || []).map((row) => this.toEntity(row));
      return Result.ok(movements);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching stock movements by reason", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(movement: StockMovement): Promise<Result<StockMovement, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const insertData = this.toInsert(movement);
      const { data, error } = await supabase
        .from("stock_movements")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while creating stock movement", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(row: StockMovementRow): StockMovement {
    return new StockMovement({
      id: row.id,
      companyId: row.company_id,
      productId: row.product_id,
      quantity: Number(row.quantity),
      direction: row.direction as StockMovement["direction"],
      reason: row.reason as StockMovement["reason"],
      referenceId: row.reference_id ?? undefined,
      referenceType: row.reference_type ?? undefined,
      notes: row.notes ?? undefined,
      performedBy: row.performed_by ?? undefined,
      createdAt: new Date(row.created_at),
    });
  }

  private toInsert(movement: StockMovement): Database["public"]["Tables"]["stock_movements"]["Insert"] {
    return {
      id: movement.id,
      company_id: movement.companyId,
      product_id: movement.productId,
      quantity: movement.quantity,
      direction: movement.direction,
      reason: movement.reason,
      reference_id: movement.referenceId ?? null,
      reference_type: movement.referenceType ?? null,
      notes: movement.notes ?? null,
      performed_by: movement.performedBy ?? null,
    };
  }
}

// ==================== SUPPLIER REPOSITORY ====================

export class SupabaseSupplierRepository implements ISupplierRepository {
  async findById(id: string): Promise<Result<Supplier, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.fail(new NotFoundError("Supplier not found"));
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      if (!data) {
        return Result.fail(new NotFoundError("Supplier not found"));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching supplier", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string, filters?: SupplierFilters): Promise<Result<Supplier[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      let query = supabase
        .from("suppliers")
        .select("*")
        .eq("company_id", companyId);

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive);
      }

      const { data, error } = await query.order("name");

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const suppliers = (data || []).map((row) => this.toEntity(row));
      return Result.ok(suppliers);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching suppliers", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(supplier: Supplier): Promise<Result<Supplier, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const insertData = this.toInsert(supplier);
      const { data, error } = await supabase
        .from("suppliers")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while creating supplier", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(supplier: Supplier): Promise<Result<Supplier, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const updateData = this.toUpdate(supplier);
      const { data, error } = await supabase
        .from("suppliers")
        .update(updateData)
        .eq("id", supplier.id)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while updating supplier", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase.from("suppliers").delete().eq("id", id);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while deleting supplier", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(row: SupplierRow): Supplier {
    return new Supplier({
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      contactInfo: row.contact_info ?? undefined,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      address: row.address ?? undefined,
      rut: row.rut ?? undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    });
  }

  private toInsert(supplier: Supplier): Database["public"]["Tables"]["suppliers"]["Insert"] {
    return {
      id: supplier.id,
      company_id: supplier.companyId,
      name: supplier.name,
      contact_info: supplier.contactInfo ?? null,
      email: supplier.email ?? null,
      phone: supplier.phone ?? null,
      address: supplier.address ?? null,
      rut: supplier.rut ?? null,
      is_active: supplier.isActive,
    };
  }

  private toUpdate(supplier: Supplier): Database["public"]["Tables"]["suppliers"]["Update"] {
    return {
      name: supplier.name,
      contact_info: supplier.contactInfo ?? null,
      email: supplier.email ?? null,
      phone: supplier.phone ?? null,
      address: supplier.address ?? null,
      rut: supplier.rut ?? null,
      is_active: supplier.isActive,
      updated_at: supplier.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}

// ==================== PURCHASE REPOSITORY ====================

export class SupabasePurchaseRepository implements IPurchaseRepository {
  async findById(id: string): Promise<Result<Purchase, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("purchases")
        .select("*, purchase_items(*)")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.fail(new NotFoundError("Purchase not found"));
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      if (!data) {
        return Result.fail(new NotFoundError("Purchase not found"));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching purchase", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string, filters?: PurchaseFilters): Promise<Result<Purchase[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      let query = supabase
        .from("purchases")
        .select("*")
        .eq("company_id", companyId);

      if (filters?.supplierId) {
        query = query.eq("supplier_id", filters.supplierId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo.toISOString());
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const purchases = (data || []).map((row) => this.toEntity(row));
      return Result.ok(purchases);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching purchases", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findBySupplier(supplierId: string): Promise<Result<Purchase[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("created_at", { ascending: false });

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const purchases = (data || []).map((row) => this.toEntity(row));
      return Result.ok(purchases);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching purchases by supplier", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(purchase: Purchase): Promise<Result<Purchase, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const insertData = this.toInsert(purchase);
      const { data, error } = await supabase
        .from("purchases")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while creating purchase", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(purchase: Purchase): Promise<Result<Purchase, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const updateData = this.toUpdate(purchase);
      const { data, error } = await supabase
        .from("purchases")
        .update(updateData)
        .eq("id", purchase.id)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while updating purchase", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase.from("purchases").delete().eq("id", id);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while deleting purchase", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(row: PurchaseRow): Purchase {
    return new Purchase({
      id: row.id,
      companyId: row.company_id,
      supplierId: row.supplier_id,
      invoiceNumber: row.invoice_number ?? undefined,
      invoiceDate: row.invoice_date ? new Date(row.invoice_date) : undefined,
      total: Number(row.total),
      paymentMethod: row.payment_method ?? undefined,
      status: row.status as Purchase["status"],
      notes: row.notes ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    });
  }

  private toInsert(purchase: Purchase): Database["public"]["Tables"]["purchases"]["Insert"] {
    return {
      id: purchase.id,
      company_id: purchase.companyId,
      supplier_id: purchase.supplierId,
      invoice_number: purchase.invoiceNumber ?? null,
      invoice_date: purchase.invoiceDate?.toISOString() ?? null,
      total: purchase.total,
      payment_method: purchase.paymentMethod ?? null,
      status: purchase.status,
      notes: purchase.notes ?? null,
    };
  }

  private toUpdate(purchase: Purchase): Database["public"]["Tables"]["purchases"]["Update"] {
    return {
      supplier_id: purchase.supplierId,
      invoice_number: purchase.invoiceNumber ?? null,
      invoice_date: purchase.invoiceDate?.toISOString() ?? null,
      total: purchase.total,
      payment_method: purchase.paymentMethod ?? null,
      status: purchase.status,
      notes: purchase.notes ?? null,
      updated_at: purchase.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
