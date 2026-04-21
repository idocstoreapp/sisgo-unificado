/**
 * Register form - creates user, company and main branch in 3 steps
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

  // Step 1: User account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Company details
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [rut, setRut] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [ivaPercentage, setIvaPercentage] = useState("19");
  const [commissionPercentage, setCommissionPercentage] = useState("40");

  // Step 3: Main branch
  const [branchName, setBranchName] = useState("Casa Matriz");
  const [branchCode, setBranchCode] = useState("MAT");
  const [branchPhone, setBranchPhone] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchEmail, setBranchEmail] = useState("");

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

  function validateStep3(): boolean {
    setError(null);

    if (!branchName.trim()) {
      setError("El nombre de la sucursal es requerido");
      return false;
    }
    if (!branchCode.trim()) {
      setError("El código de la sucursal es requerido");
      return false;
    }

    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!validateStep3()) return;

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

      // Step 2: Create company, branch and link user as admin
      const companyResult = await registerCompany(
        userResult.value.userId,
        userResult.value.email,
        {
          name: companyName,
          businessType: businessType as BusinessType,
          rut: rut || undefined,
          razonSocial: razonSocial || undefined,
          email: email,
          phone: companyPhone || undefined,
          address: companyAddress || undefined,
          ivaPercentage: parseFloat(ivaPercentage) || 19,
          commissionPercentage: parseFloat(commissionPercentage) || 40,
          mainBranch: {
            name: branchName,
            code: branchCode || undefined,
            phone: branchPhone || undefined,
            address: branchAddress || undefined,
            email: branchEmail || undefined,
          },
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
    <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
      {/* Progress indicator - 3 steps */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
        <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        <div className={`flex-1 h-2 rounded-full ${step >= 3 ? "bg-primary" : "bg-muted"}`} />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between mb-6 text-sm">
        <span className={step >= 1 ? "text-primary font-medium" : "text-muted-foreground"}>1. Cuenta</span>
        <span className={step >= 2 ? "text-primary font-medium" : "text-muted-foreground"}>2. Empresa</span>
        <span className={step >= 3 ? "text-primary font-medium" : "text-muted-foreground"}>3. Sucursal</span>
      </div>

      <h2 className="text-xl font-semibold mb-6 text-card-foreground">
        {step === 1 ? "Crear Cuenta de Admin" : step === 2 ? "Datos de la Empresa" : "Sucursal Principal"}
      </h2>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={step === 3 ? handleSubmit : undefined} className="space-y-4">
        {/* STEP 1: Account */}
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
              Siguiente: Datos de Empresa
            </Button>
          </>
        )}

        {/* STEP 2: Company */}
        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="company-name">Nombre de la Empresa *</Label>
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
              <Label htmlFor="business-type">Tipo de Negocio *</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rut">RUT / NIT</Label>
                <Input
                  id="rut"
                  type="text"
                  placeholder="12.345.678-9"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razon-social">Razón Social</Label>
                <Input
                  id="razon-social"
                  type="text"
                  placeholder="Mi Empresa SpA"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-phone">Teléfono de Contacto</Label>
              <Input
                id="company-phone"
                type="tel"
                placeholder="+56 9 1234 5678"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-address">Dirección Fiscal</Label>
              <Input
                id="company-address"
                type="text"
                placeholder="Calle 123, Ciudad"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iva-percentage">% IVA</Label>
                <Input
                  id="iva-percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={ivaPercentage}
                  onChange={(e) => setIvaPercentage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission-percentage">% Comisión Técnico</Label>
                <Input
                  id="commission-percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={commissionPercentage}
                  onChange={(e) => setCommissionPercentage(e.target.value)}
                />
              </div>
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
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
              >
                Siguiente: Sucursal
              </Button>
            </div>
          </>
        )}

        {/* STEP 3: Main Branch */}
        {step === 3 && (
          <>
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground">
                La sucursal principal es donde comenzarás a operar. Podrás agregar más sucursales después.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch-name">Nombre de Sucursal *</Label>
              <Input
                id="branch-name"
                type="text"
                placeholder="Casa Matriz"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch-code">Código Corto *</Label>
              <Input
                id="branch-code"
                type="text"
                placeholder="MAT"
                maxLength={5}
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                required
              />
              <p className="text-xs text-muted-foreground">
                Código breve para identificar la sucursal (ej: MAT, SCL, VAP)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch-phone">Teléfono</Label>
              <Input
                id="branch-phone"
                type="tel"
                placeholder="+56 9 1234 5678"
                value={branchPhone}
                onChange={(e) => setBranchPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch-address">Dirección</Label>
              <Input
                id="branch-address"
                type="text"
                placeholder="Calle 123, Ciudad"
                value={branchAddress}
                onChange={(e) => setBranchAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch-email">Email</Label>
              <Input
                id="branch-email"
                type="email"
                placeholder="sucursal@empresa.com"
                value={branchEmail}
                onChange={(e) => setBranchEmail(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(2)}
                disabled={isLoading}
              >
                Atrás
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading || isCompanyLoading}>
                {isLoading || isCompanyLoading ? "Registrando..." : "Completar Registro"}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
