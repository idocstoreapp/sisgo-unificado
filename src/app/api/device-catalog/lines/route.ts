/**
 * API Route: GET /api/device-catalog/lines?brandId=xxx
 * Returns product lines filtered by brand
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    let query = supabase.from("product_lines").select("*").eq("is_active", true).order("name");

    if (brandId) {
      query = query.eq("brand_id", brandId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, lines: [] });
    }

    return NextResponse.json({ success: true, lines: data || [] });
  } catch {
    return NextResponse.json({ success: false, lines: [] });
  }
}
