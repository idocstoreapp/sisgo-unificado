/**
 * API Route: GET /api/device-catalog/models?lineId=xxx
 * Returns models filtered by product line
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const lineId = searchParams.get("lineId");

    let query = supabase.from("models").select("*").eq("is_active", true).order("name");

    if (lineId) {
      query = query.eq("product_line_id", lineId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, models: [] });
    }

    return NextResponse.json({ success: true, models: data || [] });
  } catch {
    return NextResponse.json({ success: false, models: [] });
  }
}
