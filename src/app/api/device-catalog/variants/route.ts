/**
 * API Route: GET /api/device-catalog/variants?modelId=xxx
 * Returns variants filtered by model
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get("modelId");

    let query = supabase.from("variants").select("*").eq("is_active", true).order("name");

    if (modelId) {
      query = query.eq("model_id", modelId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, variants: [] });
    }

    return NextResponse.json({ success: true, variants: data || [] });
  } catch {
    return NextResponse.json({ success: false, variants: [] });
  }
}
