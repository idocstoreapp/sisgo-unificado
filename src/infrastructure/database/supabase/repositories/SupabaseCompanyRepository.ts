/**
 * Supabase implementation of ICompanyRepository
 * NOTE: This repository should be used in Server Actions or Server Components only.
 * For client-side usage, create API routes that use this repository.
 */

import { Result, NotFoundError, RepositoryError } from "@/shared/kernel";
import type { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import type { Company } from "@/domain/entities/Company";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";
import { toCompany, fromCompanyToInsert, fromCompanyToUpdate } from "@/infrastructure/database/supabase/mappers";

export class SupabaseCompanyRepository implements ICompanyRepository {
  async findById(id: string): Promise<Result<Company, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.fail(new NotFoundError("Company not found"));
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      if (!data) {
        return Result.fail(new NotFoundError("Company not found"));
      }

      return Result.ok(toCompany(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching company", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByRut(rut: string): Promise<Result<Company | null, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("rut", rut)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.ok(null);
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(data ? toCompany(data) : null);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching company by RUT", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByUserId(userId: string): Promise<Result<Company[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("companies")
        .select("*, users!inner(id)")
        .eq("users.id", userId);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const companies = (data ?? []).map(toCompany);
      return Result.ok(companies);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching companies by user", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(company: Company): Promise<Result<Company, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const insertData = fromCompanyToInsert(company);
      const { data, error } = await supabase
        .from("companies")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(toCompany(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while creating company", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(company: Company): Promise<Result<Company, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const updateData = fromCompanyToUpdate(company);
      const { data, error } = await supabase
        .from("companies")
        .update(updateData)
        .eq("id", company.id)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(toCompany(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while updating company", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", id);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while deleting company", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }
}
