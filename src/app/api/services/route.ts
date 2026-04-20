/**
 * API Route: GET /api/services
 * Returns all services. Supports filtering by category and active status.
 * POST /api/services - Create a new service
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");

    let query = supabase.from("services").select("*").order("name");

    if (category) {
      query = query.eq("category", category);
    }

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, services: [] });
    }

    return NextResponse.json({ success: true, services: data || [] });
  } catch {
    return NextResponse.json({ success: false, services: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const { data, error } = await supabase
      .from("services")
      .insert({
        name: body.name,
        description: body.description || null,
        category: body.category || null,
        category_image_url: body.categoryImageUrl || null,
        image_url: body.imageUrl || null,
        default_price: body.defaultPrice || 0,
        estimated_hours: body.estimatedHours || null,
        is_active: true,
        is_recommended: body.isRecommended || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true, service: data });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    });
  }
}
