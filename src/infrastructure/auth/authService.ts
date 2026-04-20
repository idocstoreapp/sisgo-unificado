/**
 * Authentication service - handles sign in, sign up, sign out
 */

import { supabase } from "@/infrastructure/database/supabase/client";
import { Result, UnexpectedError } from "@/shared/kernel";
import type { ValidationError } from "@/shared/kernel/errors";

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

/**
 * Sign up with email and password
 */
export async function signUp(input: SignUpInput): Promise<Result<{ userId: string; email: string }, ValidationError | UnexpectedError>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name: input.name,
        },
      },
    });

    if (error) {
      return Result.fail(new ValidationError(error.message, "SIGN_UP_ERROR"));
    }

    if (!data.user) {
      return Result.fail(new ValidationError("User creation failed", "USER_CREATION_FAILED"));
    }

    return Result.ok({
      userId: data.user.id,
      email: data.user.email ?? input.email,
    });
  } catch (error) {
    return Result.fail(UnexpectedError.from(error));
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(input: SignInInput): Promise<Result<{ userId: string; email: string }, ValidationError | UnexpectedError>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      return Result.fail(new ValidationError(error.message, "SIGN_IN_ERROR"));
    }

    if (!data.user) {
      return Result.fail(new ValidationError("Sign in failed", "SIGN_IN_FAILED"));
    }

    return Result.ok({
      userId: data.user.id,
      email: data.user.email ?? input.email,
    });
  } catch (error) {
    return Result.fail(UnexpectedError.from(error));
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<Result<void, UnexpectedError>> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return Result.fail(UnexpectedError.from(error));
    }
    return Result.ok(undefined);
  } catch (error) {
    return Result.fail(UnexpectedError.from(error));
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<Result<{ userId: string; email: string } | null, UnexpectedError>> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return Result.fail(UnexpectedError.from(error));
    }

    if (!session) {
      return Result.ok(null);
    }

    return Result.ok({
      userId: session.user.id,
      email: session.user.email ?? "",
    });
  } catch (error) {
    return Result.fail(UnexpectedError.from(error));
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<Result<void, ValidationError | UnexpectedError>> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return Result.fail(new ValidationError(error.message, "RESET_PASSWORD_ERROR"));
    }

    return Result.ok(undefined);
  } catch (error) {
    return Result.fail(UnexpectedError.from(error));
  }
}
