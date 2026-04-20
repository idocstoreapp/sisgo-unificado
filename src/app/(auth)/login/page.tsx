/**
 * Login page - email/password authentication
 */

import { Suspense } from "react";
import { LoginForm } from "@/presentation/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">S</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">SISGO</h1>
          <p className="text-muted-foreground mt-2">
            Sistema de Gestión Unificado
          </p>
        </div>

        {/* Login form */}
        <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
          <LoginForm />
        </Suspense>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="text-primary hover:underline font-medium">
            Regístrate aquí
          </a>
        </p>
      </div>
    </div>
  );
}
