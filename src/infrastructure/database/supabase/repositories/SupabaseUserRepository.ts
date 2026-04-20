/**
 * Supabase implementation of IUserRepository
 */

import { Result, NotFoundError, RepositoryError } from "@/shared/kernel";
import type { IUserRepository } from "@/domain/repositories/IUserRepository";
import type { User } from "@/domain/entities/User";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";
import { toUser, fromUserToInsert, fromUserToUpdate } from "@/infrastructure/database/supabase/mappers";

export class SupabaseUserRepository implements IUserRepository {
  async findById(id: string): Promise<Result<User, NotFoundError | RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.fail(new NotFoundError("User not found"));
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      if (!data) {
        return Result.fail(new NotFoundError("User not found"));
      }

      return Result.ok(toUser(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching user", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByEmailAndCompany(email: string, companyId: string): Promise<Result<User | null, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("company_id", companyId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return Result.ok(null);
        }
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(data ? toUser(data) : null);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching user by email and company", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByCompanyId(companyId: string): Promise<Result<User[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("company_id", companyId)
        .order("name", { ascending: true });

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const users = (data ?? []).map(toUser);
      return Result.ok(users);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching users by company", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByBranchId(branchId: string): Promise<Result<User[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("branch_id", branchId)
        .order("name", { ascending: true });

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const users = (data ?? []).map(toUser);
      return Result.ok(users);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching users by branch", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async findByRole(companyId: string, role: string): Promise<Result<User[], RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("company_id", companyId)
        .eq("role", role)
        .order("name", { ascending: true });

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      const users = (data ?? []).map(toUser);
      return Result.ok(users);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while fetching users by role", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async create(user: User): Promise<Result<User, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const insertData = fromUserToInsert(user);
      const { data, error } = await supabase
        .from("users")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(toUser(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while creating user", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async update(user: User): Promise<Result<User, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const updateData = fromUserToUpdate(user);
      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(toUser(data));
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while updating user", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await getSupabaseAdmin();
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", id);

      if (error) {
        return Result.fail(new RepositoryError(error.message, error.code));
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(new RepositoryError("Unexpected error while deleting user", "UNEXPECTED_ERROR", { originalError: error }));
    }
  }
}
