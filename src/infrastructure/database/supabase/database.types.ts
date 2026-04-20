/**
 * Database types - auto-generated from Supabase schema
 * 
 * To regenerate this file, run:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/infrastructure/database/supabase/database.types.ts
 * 
 * For now, this is a placeholder. The actual types will be generated
 * when the database schema is created in Supabase.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          business_type: string;
          rut: string | null;
          razon_social: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          logo_url: string | null;
          config: Json;
          iva_percentage: number;
          commission_percentage: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          business_type: string;
          rut?: string | null;
          razon_social?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          logo_url?: string | null;
          config?: Json;
          iva_percentage?: number;
          commission_percentage?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          business_type?: string;
          rut?: string | null;
          razon_social?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          logo_url?: string | null;
          config?: Json;
          iva_percentage?: number;
          commission_percentage?: number;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      branches: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          code: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          logo_url: string | null;
          is_active: boolean;
          config: Json;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          code?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          is_active?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          code?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          is_active?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string | null;
          role: string;
          name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          permissions: Json;
          commission_percentage: number | null;
          sueldo_base: number;
          sueldo_frecuencia: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          company_id: string;
          branch_id?: string | null;
          role: string;
          name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          permissions?: Json;
          commission_percentage?: number | null;
          sueldo_base?: number;
          sueldo_frecuencia?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          branch_id?: string | null;
          role?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          permissions?: Json;
          commission_percentage?: number | null;
          sueldo_base?: number;
          sueldo_frecuencia?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      work_orders: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string | null;
          customer_id: string;
          assigned_to: string | null;
          created_by: string | null;
          order_number: string;
          business_type: string;
          metadata: Json;
          status: string;
          priority: string;
          commitment_date: string | null;
          delivered_at: string | null;
          replacement_cost: number;
          labor_cost: number;
          total_cost: number;
          total_price: number;
          payment_method: string | null;
          receipt_number: string | null;
          paid_at: string | null;
          warranty_days: number;
          warranty_expires_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          branch_id?: string | null;
          customer_id: string;
          assigned_to?: string | null;
          created_by?: string | null;
          order_number: string;
          business_type: string;
          metadata?: Json;
          status?: string;
          priority?: string;
          commitment_date?: string | null;
          delivered_at?: string | null;
          replacement_cost?: number;
          labor_cost?: number;
          total_cost?: number;
          total_price?: number;
          payment_method?: string | null;
          receipt_number?: string | null;
          paid_at?: string | null;
          warranty_days?: number;
          warranty_expires_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          branch_id?: string | null;
          customer_id?: string;
          assigned_to?: string | null;
          created_by?: string | null;
          order_number?: string;
          business_type?: string;
          metadata?: Json;
          status?: string;
          priority?: string;
          commitment_date?: string | null;
          delivered_at?: string | null;
          replacement_cost?: number;
          labor_cost?: number;
          total_cost?: number;
          total_price?: number;
          payment_method?: string | null;
          receipt_number?: string | null;
          paid_at?: string | null;
          warranty_days?: number;
          warranty_expires_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          name: string;
          description: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          name: string;
          description?: string | null;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          name?: string;
          description?: string | null;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          metadata?: Json;
          created_at?: string;
        };
      };
      employee_payments: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          order_id: string | null;
          payment_type: string;
          amount: number;
          commission_percentage: number | null;
          week_start: string | null;
          month: number | null;
          year: number | null;
          status: string;
          paid_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id: string;
          order_id?: string | null;
          payment_type: string;
          amount: number;
          commission_percentage?: number | null;
          week_start?: string | null;
          month?: number | null;
          year?: number | null;
          status?: string;
          paid_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string;
          order_id?: string | null;
          payment_type?: string;
          amount?: number;
          commission_percentage?: number | null;
          week_start?: string | null;
          month?: number | null;
          year?: number | null;
          status?: string;
          paid_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      expenses: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string | null;
          created_by: string | null;
          expense_type: string;
          category: string | null;
          amount: number;
          payment_method: string | null;
          receipt_number: string | null;
          receipt_url: string | null;
          expense_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          branch_id?: string | null;
          created_by?: string | null;
          expense_type: string;
          category?: string | null;
          amount: number;
          payment_method?: string | null;
          receipt_number?: string | null;
          receipt_url?: string | null;
          expense_date: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          branch_id?: string | null;
          created_by?: string | null;
          expense_type?: string;
          category?: string | null;
          amount?: number;
          payment_method?: string | null;
          receipt_number?: string | null;
          receipt_url?: string | null;
          expense_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      savings_fund: {
        Row: {
          id: string;
          company_id: string;
          amount: number;
          type: string;
          reason: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          amount: number;
          type: string;
          reason?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          amount?: number;
          type?: string;
          reason?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      salary_adjustments: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          type: string;
          amount: number;
          loan_type: string | null;
          notes: string | null;
          remaining_balance: number;
          is_fully_paid: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id: string;
          type: string;
          amount: number;
          loan_type?: string | null;
          notes?: string | null;
          remaining_balance?: number;
          is_fully_paid?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string;
          type?: string;
          amount?: number;
          loan_type?: string | null;
          notes?: string | null;
          remaining_balance?: number;
          is_fully_paid?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      customers: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          phone_country_code: string;
          rut_document: string | null;
          address: string | null;
          city: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          phone_country_code?: string;
          rut_document?: string | null;
          address?: string | null;
          city?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          phone_country_code?: string;
          rut_document?: string | null;
          address?: string | null;
          city?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
