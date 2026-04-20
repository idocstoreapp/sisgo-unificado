/**
 * Supabase implementations for Material, Service, and FurnitureCatalog repositories
 */

import { Result, NotFoundError, RepositoryError } from "@/shared/kernel";
import type { IMaterialRepository, MaterialFilters } from "@/domain/repositories/IMaterialRepository";
import type { Material } from "@/domain/entities/Material";
import type { ServiceRepository } from "@/domain/repositories/IServiceRepository";
import type { Service } from "@/domain/entities/Service";
import type { FurnitureCatalogRepository } from "@/domain/repositories/IFurnitureCatalogRepository";
import type { FurnitureCatalog, FurnitureVariant } from "@/domain/entities/FurnitureCatalog";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";
import type { Database } from "@/infrastructure/database/supabase/database.types";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type FurnitureRow = Database["public"]["Tables"]["furniture_catalog"]["Row"];
type VariantRow = Database["public"]["Tables"]["furniture_variants"]["Row"];

// ==================== MATERIAL REPOSITORY ====================

export class SupabaseMaterialRepository implements IMaterialRepository {
  async findById(id: string): Promise<Result<Material, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.fail(new NotFoundError("Material not found"));
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      if (!data) {
        return Result.fail(new NotFoundError("Material not found"));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching material", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string, filters?: MaterialFilters): Promise<Result<Material[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      let query = supabase
        .from("materials")
        .select("*")
        .eq("company_id", companyId);

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
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

      const materials = (data || []).map((row) => this.toEntity(row));
      return Result.ok(materials);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching materials", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCategory(companyId: string, category: string): Promise<Result<Material[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("company_id", companyId)
        .eq("category", category)
        .order("name");

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const materials = (data || []).map((row) => this.toEntity(row));
      return Result.ok(materials);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching materials by category", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findLowStock(companyId: string): Promise<Result<Material[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("company_id", companyId)
        .lte("current_stock", supabase.rpc("materials_min_stock"))
        .order("name");

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const materials = (data || []).map((row) => this.toEntity(row));
      return Result.ok(materials);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching low stock materials", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(material: Material): Promise<Result<Material, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const insertData = this.toInsert(material);
      const { data, error } = await supabase
        .from("materials")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while creating material", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(material: Material): Promise<Result<Material, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const updateData = this.toUpdate(material);
      const { data, error } = await supabase
        .from("materials")
        .update(updateData)
        .eq("id", material.id)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while updating material", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase.from("materials").delete().eq("id", id);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while deleting material", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(row: MaterialRow): Material {
    return new Material({
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      description: row.description ?? undefined,
      category: row.category ?? undefined,
      unitType: row.unit_type as Material["unitType"],
      costPrice: Number(row.cost_price),
      salePrice: Number(row.sale_price),
      currentStock: Number(row.current_stock),
      minStock: Number(row.min_stock),
      supplierId: row.supplier_id ?? undefined,
      imageUrl: row.image_url ?? undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    });
  }

  private toInsert(material: Material): Database["public"]["Tables"]["materials"]["Insert"] {
    return {
      id: material.id,
      company_id: material.companyId,
      name: material.name,
      description: material.description ?? null,
      category: material.category ?? null,
      unit_type: material.unitType,
      cost_price: material.costPrice,
      sale_price: material.salePrice,
      current_stock: material.currentStock,
      min_stock: material.minStock,
      supplier_id: material.supplierId ?? null,
      image_url: material.imageUrl ?? null,
      is_active: material.isActive,
    };
  }

  private toUpdate(material: Material): Database["public"]["Tables"]["materials"]["Update"] {
    return {
      name: material.name,
      description: material.description ?? null,
      category: material.category ?? null,
      unit_type: material.unitType,
      cost_price: material.costPrice,
      sale_price: material.salePrice,
      current_stock: material.currentStock,
      min_stock: material.minStock,
      supplier_id: material.supplierId ?? null,
      image_url: material.imageUrl ?? null,
      is_active: material.isActive,
      updated_at: material.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}

// ==================== SERVICE REPOSITORY ====================

export class SupabaseServiceRepository implements ServiceRepository {
  async findById(id: string): Promise<Result<Service, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.fail(new NotFoundError("Service not found"));
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      if (!data) {
        return Result.fail(new NotFoundError("Service not found"));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching service", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string, category?: string): Promise<Result<Service[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      let query = supabase
        .from("services")
        .select("*")
        .eq("company_id", companyId);

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query.order("name");

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const services = (data || []).map((row) => this.toEntity(row));
      return Result.ok(services);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching services", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCategory(companyId: string, category: string): Promise<Result<Service[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("company_id", companyId)
        .eq("category", category)
        .order("name");

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const services = (data || []).map((row) => this.toEntity(row));
      return Result.ok(services);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching services by category", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(service: Service): Promise<Result<Service, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const insertData = this.toInsert(service);
      const { data, error } = await supabase
        .from("services")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while creating service", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(service: Service): Promise<Result<Service, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const updateData = this.toUpdate(service);
      const { data, error } = await supabase
        .from("services")
        .update(updateData)
        .eq("id", service.id)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(this.toEntity(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while updating service", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase.from("services").delete().eq("id", id);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while deleting service", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(row: ServiceRow): Service {
    return new Service({
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      description: row.description ?? undefined,
      category: row.category ?? undefined,
      pricePerHour: Number(row.price_per_hour),
      estimatedHours: row.estimated_hours ?? undefined,
      imageUrl: row.image_url ?? undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    });
  }

  private toInsert(service: Service): Database["public"]["Tables"]["services"]["Insert"] {
    return {
      id: service.id,
      company_id: service.companyId,
      name: service.name,
      description: service.description ?? null,
      category: service.category ?? null,
      price_per_hour: service.pricePerHour,
      estimated_hours: service.estimatedHours ?? null,
      image_url: service.imageUrl ?? null,
      is_active: service.isActive,
    };
  }

  private toUpdate(service: Service): Database["public"]["Tables"]["services"]["Update"] {
    return {
      name: service.name,
      description: service.description ?? null,
      category: service.category ?? null,
      price_per_hour: service.pricePerHour,
      estimated_hours: service.estimatedHours ?? null,
      image_url: service.imageUrl ?? null,
      is_active: service.isActive,
      updated_at: service.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}

// ==================== FURNITURE CATALOG REPOSITORY ====================

export class SupabaseFurnitureCatalogRepository implements FurnitureCatalogRepository {
  async findById(id: string): Promise<Result<FurnitureCatalog, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("furniture_catalog")
        .select("*, furniture_variants(*)")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.fail(new NotFoundError("Furniture catalog not found"));
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      if (!data) {
        return Result.fail(new NotFoundError("Furniture catalog not found"));
      }

      return Result.ok(this.toEntity(data, data.furniture_variants || []));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching furniture catalog", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompany(companyId: string, category?: string): Promise<Result<FurnitureCatalog[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      let query = supabase
        .from("furniture_catalog")
        .select("*, furniture_variants(*)")
        .eq("company_id", companyId);

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query.order("name");

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const furniture = (data || []).map((row) => this.toEntity(row, row.furniture_variants || []));
      return Result.ok(furniture);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching furniture catalogs", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCategory(companyId: string, category: string): Promise<Result<FurnitureCatalog[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("furniture_catalog")
        .select("*, furniture_variants(*)")
        .eq("company_id", companyId)
        .eq("category", category)
        .order("name");

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const furniture = (data || []).map((row) => this.toEntity(row, row.furniture_variants || []));
      return Result.ok(furniture);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching furniture catalogs by category", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(furniture: FurnitureCatalog): Promise<Result<FurnitureCatalog, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const insertData = this.toInsert(furniture);
      const { data: furnitureData, error: furnitureError } = await supabase
        .from("furniture_catalog")
        .insert(insertData)
        .select()
        .single();

      if (furnitureError) {
        return Result.fail(new RepositoryError(furnitureError.message, furnitureError.code));
      }

      if (furniture.variants.length > 0) {
        const variantsToInsert = furniture.variants.map((v) => this.variantToInsert(v, furnitureData.id));
        const { error: variantsError } = await supabase.from("furniture_variants").insert(variantsToInsert);

        if (variantsError) {
          return Result.fail(new RepositoryError(variantsError.message, variantsError.code));
        }
      }

      const { data: fullData, error: fetchError } = await supabase
        .from("furniture_catalog")
        .select("*, furniture_variants(*)")
        .eq("id", furnitureData.id)
        .single();

      if (fetchError) {
        return Result.fail(new RepositoryError(fetchError.message, fetchError.code));
      }

      return Result.ok(this.toEntity(fullData, fullData.furniture_variants || []));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while creating furniture catalog", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(furniture: FurnitureCatalog): Promise<Result<FurnitureCatalog, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const updateData = this.toUpdate(furniture);
      const { error: furnitureError } = await supabase
        .from("furniture_catalog")
        .update(updateData)
        .eq("id", furniture.id);

      if (furnitureError) {
        return Result.fail(new RepositoryError(furnitureError.message, furnitureError.code));
      }

      const { error: deleteError } = await supabase.from("furniture_variants").delete().eq("furniture_id", furniture.id);

      if (deleteError) {
        return Result.fail(new RepositoryError(deleteError.message, deleteError.code));
      }

      if (furniture.variants.length > 0) {
        const variantsToInsert = furniture.variants.map((v) => this.variantToInsert(v, furniture.id));
        const { error: variantsError } = await supabase.from("furniture_variants").insert(variantsToInsert);

        if (variantsError) {
          return Result.fail(new RepositoryError(variantsError.message, variantsError.code));
        }
      }

      const { data: fullData, error: fetchError } = await supabase
        .from("furniture_catalog")
        .select("*, furniture_variants(*)")
        .eq("id", furniture.id)
        .single();

      if (fetchError) {
        return Result.fail(new RepositoryError(fetchError.message, fetchError.code));
      }

      return Result.ok(this.toEntity(fullData, fullData.furniture_variants || []));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while updating furniture catalog", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase.from("furniture_catalog").delete().eq("id", id);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while deleting furniture catalog", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  private toEntity(row: FurnitureRow, variants: VariantRow[]): FurnitureCatalog {
    const variantEntities = variants.map((v) => {
      return new FurnitureVariant({
        id: v.id,
        furnitureId: v.furniture_id,
        name: v.name,
        dimensions: v.dimensions ?? undefined,
        color: v.color ?? undefined,
        material: v.material ?? undefined,
        additionalCost: Number(v.additional_cost),
        isActive: v.is_active,
      });
    });

    return new FurnitureCatalog({
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      description: row.description ?? undefined,
      category: row.category ?? undefined,
      basePrice: Number(row.base_price),
      baseMaterialsCost: Number(row.base_materials_cost),
      baseLaborHours: Number(row.base_labor_hours),
      imageUrl: row.image_url ?? undefined,
      variants: variantEntities,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    });
  }

  private toInsert(furniture: FurnitureCatalog): Database["public"]["Tables"]["furniture_catalog"]["Insert"] {
    return {
      id: furniture.id,
      company_id: furniture.companyId,
      name: furniture.name,
      description: furniture.description ?? null,
      category: furniture.category ?? null,
      base_price: furniture.basePrice,
      base_materials_cost: furniture.baseMaterialsCost,
      base_labor_hours: furniture.baseLaborHours,
      image_url: furniture.imageUrl ?? null,
      is_active: furniture.isActive,
    };
  }

  private toUpdate(furniture: FurnitureCatalog): Database["public"]["Tables"]["furniture_catalog"]["Update"] {
    return {
      name: furniture.name,
      description: furniture.description ?? null,
      category: furniture.category ?? null,
      base_price: furniture.basePrice,
      base_materials_cost: furniture.baseMaterialsCost,
      base_labor_hours: furniture.baseLaborHours,
      image_url: furniture.imageUrl ?? null,
      is_active: furniture.isActive,
      updated_at: furniture.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private variantToInsert(
    variant: FurnitureVariant,
    furnitureId: string
  ): Database["public"]["Tables"]["furniture_variants"]["Insert"] {
    return {
      id: variant.id,
      furniture_id: furnitureId,
      name: variant.name,
      dimensions: variant.dimensions ?? null,
      color: variant.color ?? null,
      material: variant.material ?? null,
      additional_cost: variant.additionalCost,
      is_active: variant.isActive,
    };
  }
}
