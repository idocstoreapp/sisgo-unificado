/**
 * Register page - company registration wizard entry point
 */

import { Suspense } from "react";
import { RegisterForm } from "@/presentation/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-lg">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">S</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">SISGO</h1>
          <p className="text-muted-foreground mt-2">
            Registra tu empresa
          </p>
        </div>

        {/* Register form */}
        <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
          <RegisterForm />
        </Suspense>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}
