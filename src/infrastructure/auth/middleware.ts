/**
 * Supabase middleware for session management and trial gating
 */

import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isTrialBlocked, isTrialProtectedPath } from "@/lib/trial-gating";

const WRITE_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(({ name, value }) => ({
            name,
            value,
          }));
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protect routes that require authentication
  const protectedRoutes = ["/dashboard", "/orders", "/customers", "/finance", "/settings", "/reports"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (request.nextUrl.pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (user && WRITE_METHODS.has(request.method) && isTrialProtectedPath(request.nextUrl.pathname)) {
    const { data: profile } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profile?.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("config")
        .eq("id", profile.company_id)
        .single();

      const companyConfig = (company as { config?: Record<string, unknown> } | null)?.config;

      if (isTrialBlocked(companyConfig)) {
        const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

        if (isApiRoute) {
          return NextResponse.json(
            { success: false, error: "trial_expired", message: "Tu periodo de prueba ha expirado. Activa un plan para continuar." },
            { status: 402 },
          );
        }

        const redirectUrl = new URL("/billing/activate", request.url);
        redirectUrl.searchParams.set("reason", "trial_expired");
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
