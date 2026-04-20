/**
 * Register form - creates user and company in one step
 */

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/infrastructure/auth/authService";
import { useCompany } from "@/presentation/hooks/useCompany";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";
import { BUSINESS_TYPE_LABELS } from "@/shared/constants";
import type { BusinessType } from "@/shared/kernel/types";

export function RegisterForm() {
  const router = useRouter();
  const { registerCompany, isLoading: isCompanyLoading } = useCompany();

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // User fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Company fields
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");

  function validateStep1(): boolean {
    setError(null);

    if (!name.trim()) {
      setError("El nombre es requerido");
      return false;
    }
    if (!email.includes("@")) {
      setError("Email inválido");
      return false;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }

    return true;
  }

  function validateStep2(): boolean {
    setError(null);

    if (!companyName.trim()) {
      setError("El nombre de la empresa es requerido");
      return false;
    }
    if (!businessType) {
      setError("Selecciona un tipo de negocio");
      return false;
    }

    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!validateStep2()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create user auth account
      const userResult = await signUp({
        email,
        password,
        name,
      });

      if (userResult.isFailure) {
        setError(userResult.error?.message ?? "Error al crear usuario");
        setIsLoading(false);
        return;
      }

      if (!userResult.value) {
        setError("Error al crear usuario: datos no disponibles");
        setIsLoading(false);
        return;
      }

      // Step 2: Create company and link user as admin
      const companyResult = await registerCompany(
        userResult.value.userId,
        userResult.value.email,
        {
          name: companyName,
          businessType: businessType as BusinessType,
        }
      );

      if (!companyResult.success) {
        setError(companyResult.error ?? "Error al registrar empresa");
        setIsLoading(false);
        return;
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error inesperado. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
        <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
      </div>

      <h2 className="text-xl font-semibold mb-6 text-card-foreground">
        {step === 1 ? "Crear Cuenta" : "Datos de la Empresa"}
      </h2>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={step === 2 ? handleSubmit : undefined} className="space-y-4">
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-register">Email</Label>
              <Input
                id="email-register"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-register">Contraseña</Label>
              <Input
                id="password-register"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
            >
              Siguiente
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="company-name">Nombre de la Empresa</Label>
              <Input
                id="company-name"
                type="text"
                placeholder="Mi Empresa SpA"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-type">Tipo de Negocio</Label>
              <Select value={businessType} onValueChange={setBusinessType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BUSINESS_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Esto determinará las funcionalidades disponibles
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                Atrás
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading || isCompanyLoading}>
                {isLoading || isCompanyLoading ? "Registrando..." : "Registrarse"}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
