/**
 * Supabase implementation of IBranchRepository
 */

import { Result, NotFoundError, RepositoryError } from "@/shared/kernel";
import type { IBranchRepository } from "@/domain/repositories/IBranchRepository";
import type { Branch } from "@/domain/entities/Branch";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";
import { toBranch, fromBranchToInsert, fromBranchToUpdate } from "@/infrastructure/database/supabase/mappers";

export class SupabaseBranchRepository implements IBranchRepository {
  async findById(id: string): Promise<Result<Branch, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.fail(new NotFoundError("Branch not found"));
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      if (!data) {
        return Result.fail(new NotFoundError("Branch not found"));
      }

      return Result.ok(toBranch(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching branch", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompanyId(companyId: string): Promise<Result<Branch[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("company_id", companyId)
        .order("name", { ascending: true });

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const branches = (data ?? []).map(toBranch);
      return Result.ok(branches);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching branches by company", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(branch: Branch): Promise<Result<Branch, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const insertData = fromBranchToInsert(branch);
      const { data, error } = await supabase
        .from("branches")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(toBranch(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while creating branch", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(branch: Branch): Promise<Result<Branch, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const updateData = fromBranchToUpdate(branch);
      const { data, error } = await supabase
        .from("branches")
        .update(updateData)
        .eq("id", branch.id)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(toBranch(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while updating branch", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase
        .from("branches")
        .delete()
        .eq("id", id);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while deleting branch", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }
}
