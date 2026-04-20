/**
 * API Route: GET /api/device-catalog
 * Returns the full device catalog (types, brands, lines, models, variants)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    const [deviceTypesRes, brandsRes, linesRes, modelsRes, variantsRes] =
      await Promise.all([
        supabase.from("device_types").select("*").eq("is_active", true).order("name"),
        supabase.from("brands").select("*").eq("is_active", true).order("name"),
        supabase.from("product_lines").select("*").eq("is_active", true).order("name"),
        supabase.from("models").select("*").eq("is_active", true).order("name"),
        supabase.from("variants").select("*").eq("is_active", true).order("name"),
      ]);

    // Check for errors (but don't fail if a table doesn't exist yet)
    const safeData = <T>(res: { data: T | null; error: unknown }) =>
      res.error ? [] : (res.data ?? []);

    return NextResponse.json({
      success: true,
      deviceTypes: safeData(deviceTypesRes),
      brands: safeData(brandsRes),
      lines: safeData(linesRes),
      models: safeData(modelsRes),
      variants: safeData(variantsRes),
    });
  } catch (error) {
    console.error("Error fetching device catalog:", error);
    return NextResponse.json({
      success: false,
      deviceTypes: [],
      brands: [],
      lines: [],
      models: [],
      variants: [],
    });
  }
}
