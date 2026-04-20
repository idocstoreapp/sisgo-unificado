/**
 * API Route: GET /api/device-catalog/brands?typeId=xxx
 * Returns brands filtered by device type or all brands if no filter
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get("typeId");

    let query = supabase.from("brands").select("*").eq("is_active", true).order("name");

    if (typeId) {
      query = query.eq("device_type_id", typeId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, brands: [] });
    }

    return NextResponse.json({ success: true, brands: data || [] });
  } catch {
    return NextResponse.json({ success: false, brands: [] });
  }
}
