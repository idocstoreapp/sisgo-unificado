/**
 * useAuth hook - provides authentication state and actions
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/infrastructure/database/supabase/client";
import { signIn, signOut as authSignOut } from "@/infrastructure/auth/authService";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

interface UseAuthReturn {
  session: Session | null;
  user: SupabaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const result = await signIn({ email, password });
    if (result.isFailure) {
      return { success: false, error: result.error?.message };
    }
    router.push("/dashboard");
    router.refresh();
    return { success: true };
  }, [router]);

  const handleSignOut = useCallback(async () => {
    await authSignOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };
}
