/**
 * API Route: GET /api/checklist-items?deviceType=xxx
 * Returns checklist items for a specific device type
 * POST /api/checklist-items - Create a new checklist item
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const deviceType = searchParams.get("deviceType");

    let query = supabase.from("device_checklist_items").select("*").order("item_order");

    if (deviceType) {
      query = query.eq("device_type", deviceType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, items: [] });
    }

    return NextResponse.json({ success: true, items: data || [] });
  } catch {
    return NextResponse.json({ success: false, items: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const { data, error } = await supabase
      .from("device_checklist_items")
      .insert({
        device_type: body.deviceType,
        item_name: body.itemName,
        item_order: body.itemOrder || 0,
        status_options: body.statusOptions || ["Funcionando", "Dañado", "Reparado", "No probado"],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    });
  }
}
