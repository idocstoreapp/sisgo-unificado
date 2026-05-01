/**
 * API Route: GET /api/customers?search=xxx
 * Search customers by name, email, or phone.
 * POST /api/customers - Creates a customer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/infrastructure/database/supabase/admin-client";

type CustomerRow = { id: string; [key: string]: unknown };

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");

    if (email) {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .ilike("email", email)
        .limit(10);

      if (error) {
        return NextResponse.json({ success: false, customers: [] });
      }

      return NextResponse.json({ success: true, customers: data || [] });
    }

    if (phone) {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .ilike("phone", phone)
        .limit(10);

      if (error) {
        return NextResponse.json({ success: false, customers: [] });
      }

      return NextResponse.json({ success: true, customers: data || [] });
    }

    if (search && search.length >= 2) {
      const searchPattern = `%${search}%`;
      const [nameRes, emailRes, phoneRes] = await Promise.all([
        supabase.from("customers").select("*").ilike("name", searchPattern).limit(10),
        supabase.from("customers").select("*").ilike("email", searchPattern).limit(10),
        supabase.from("customers").select("*").ilike("phone", searchPattern).limit(10),
      ]);

      const allResults: CustomerRow[] = [
        ...(nameRes.data || []),
        ...(emailRes.data || []),
        ...(phoneRes.data || []),
      ];

      const uniqueCustomers = Array.from(
        new Map(allResults.map((customer) => [customer.id, customer])).values(),
      ).slice(0, 10);

      return NextResponse.json({ success: true, customers: uniqueCustomers });
    }

    return NextResponse.json({ success: true, customers: [] });
  } catch {
    return NextResponse.json({ success: false, customers: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseAdmin();
    const body = await request.json();

    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone,
        phone_country_code: body.phoneCountryCode || "+56",
        rut_document: body.rutDocument || null,
        address: body.address || null,
        city: body.city || null,
        notes: body.notes || null,
      } as never)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        const { data: existing } = await supabase
          .from("customers")
          .select("*")
          .eq("email", body.email)
          .eq("phone", body.phone)
          .maybeSingle();

        if (existing) {
          return NextResponse.json({ success: true, customer: existing, alreadyExists: true });
        }
      }

      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true, customer: data });
  } catch {
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    });
  }
}
