/**
 * Login form component
 */

"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/infrastructure/auth/authService";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn({ email, password });

      if (result.isFailure) {
        setError(result.error?.message ?? "Error al iniciar sesión");
        setIsLoading(false);
        return;
      }

      // Use window.location for reliable redirect
      // Force a small delay to ensure session cookie is set
      setTimeout(() => {
        window.location.href = redirect;
      }, 100);
    } catch {
      setError("Error inesperado. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-[22px] border border-[#e2e7f5] bg-white p-8 shadow-[0_30px_80px_rgba(44,52,112,0.12)] sm:p-12">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-xl bg-black text-2xl font-black text-white shadow-[0_18px_44px_rgba(16,22,54,0.24)]">
          S
        </div>
        <h1 className="text-3xl font-black tracking-normal text-[#080d2a]">Bienvenido de vuelta</h1>
        <p className="mt-3 text-lg font-medium text-[#7a86a4]">Inicia sesión para continuar</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-7">
        <div className="space-y-3">
          <Label htmlFor="email" className="font-black text-[#101733]">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[#7d88a6]" />
            <Input
              id="email"
              type="email"
              placeholder="ej: admin@taller.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="h-14 rounded-lg border-[#d9deec] bg-white pl-12 text-base font-medium shadow-[0_8px_24px_rgba(47,56,118,0.05)] placeholder:text-[#8a94ad] focus-visible:border-[#5660ff] focus-visible:ring-[#5660ff]/18"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="font-black text-[#101733]">
              Contraseña
            </Label>
            <a
              href="/forgot-password"
              className="text-sm font-bold text-[#4f58ff] transition-colors hover:text-[#2734ff]"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <div className="relative">
            <LockKeyhole className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[#7d88a6]" />
            <Input
              id="password"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="h-14 rounded-lg border-[#d9deec] bg-white pr-12 pl-12 text-base font-medium shadow-[0_8px_24px_rgba(47,56,118,0.05)] placeholder:text-[#8a94ad] focus-visible:border-[#5660ff] focus-visible:ring-[#5660ff]/18"
            />
            <Eye className="absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-[#7d88a6]" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 text-sm font-semibold">
          <label className="inline-flex items-center gap-3 text-[#4d5878]">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-[#cdd4ea] accent-[#4f58ff]"
            />
            Recordarme
          </label>
          <a href="/login" className="font-bold text-[#4f58ff] hover:text-[#2734ff]">
            ¿Necesitas ayuda?
          </a>
        </div>

        <Button
          type="submit"
          className="h-16 w-full rounded-lg bg-[linear-gradient(100deg,#030717_0%,#171950_58%,#2630d9_100%)] text-base font-black text-white shadow-[0_18px_44px_rgba(45,50,150,0.25)] hover:opacity-95"
          disabled={isLoading}
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </form>

      <div className="mt-9 rounded-lg border border-[#e3e8f7] bg-[#fbfcff] p-5">
        <div className="flex items-center gap-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#eef0ff] text-[#4f58ff]">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <p className="font-black text-[#101733]">Conexión segura</p>
            <p className="mt-1 text-sm leading-6 font-medium text-[#6d7899]">
              Tus datos están encriptados y protegidos con los más altos estándares de seguridad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
