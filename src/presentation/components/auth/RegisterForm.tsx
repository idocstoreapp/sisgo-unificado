/**
 * Adaptive registration wizard for company onboarding.
 */

"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CreditCard, Users, Wrench } from "lucide-react";
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
import type {
  CompanyMode,
  CompanySize,
  CompanyUsageMode,
} from "@/application/dtos/CreateCompanyDTO";

const steps = ["Cuenta", "Empresa", "Operación", "Sucursal"];

const sizeOptions: Array<{
  value: CompanySize;
  title: string;
  description: string;
}> = [
  {
    value: "solo",
    title: "Trabajo solo",
    description: "Un dueño o técnico registra y gestiona todo.",
  },
  {
    value: "single_location",
    title: "Local único",
    description: "Un equipo pequeño opera desde una sucursal.",
  },
  {
    value: "multi_branch",
    title: "Multi sucursal",
    description: "Necesitas separar operación, usuarios y reportes por local.",
  },
];

function getCompanyMode(companySize: CompanySize, usageMode: CompanyUsageMode): CompanyMode {
  if (companySize === "multi_branch") return "multi_branch";
  if (companySize === "solo" && usageMode === "owner_only") return "solo_owner";
  return "team";
}

export function RegisterForm() {
  const router = useRouter();
  const { registerCompany, isLoading: isCompanyLoading } = useCompany();

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("servicio_tecnico");

  const [companySize, setCompanySize] = useState<CompanySize>("solo");
  const [usageMode, setUsageMode] = useState<CompanyUsageMode>("owner_only");
  const [needsTechniciansModule, setNeedsTechniciansModule] = useState(true);
  const [needsTechnicianPayments, setNeedsTechnicianPayments] = useState(false);

  const [branchName, setBranchName] = useState("Casa Matriz");
  const [branchCode, setBranchCode] = useState("MAT");
  const [branchAddress, setBranchAddress] = useState("");

  const companyMode = useMemo(
    () => getCompanyMode(companySize, usageMode),
    [companySize, usageMode],
  );
  const shouldShowBranchStep = companySize !== "solo";
  const totalSteps = shouldShowBranchStep ? 4 : 3;
  const isSubmitting = isLoading || isCompanyLoading;

  function setStepError(message: string) {
    setError(message);
    return false;
  }

  function validateStep1(): boolean {
    setError(null);
    if (!name.trim()) return setStepError("Ingresa tu nombre.");
    if (!email.includes("@")) return setStepError("Ingresa un email válido.");
    if (password.length < 6) return setStepError("La contraseña debe tener al menos 6 caracteres.");
    if (password !== confirmPassword) return setStepError("Las contraseñas no coinciden.");
    return true;
  }

  function validateStep2(): boolean {
    setError(null);
    if (!companyName.trim()) return setStepError("Ingresa el nombre comercial del taller.");
    if (!businessType) return setStepError("Selecciona el tipo de negocio.");
    return true;
  }

  function validateStep3(): boolean {
    setError(null);
    if (companySize === "solo" && usageMode !== "owner_only") {
      return setStepError("Para trabajo solo usa el modo dueño solo.");
    }
    return true;
  }

  function validateStep4(): boolean {
    setError(null);
    if (!shouldShowBranchStep) return true;
    if (!branchName.trim()) return setStepError("Ingresa el nombre de la sucursal principal.");
    if (!branchCode.trim()) return setStepError("Ingresa un código corto para la sucursal.");
    return true;
  }

  function goNext() {
    const valid =
      step === 1
        ? validateStep1()
        : step === 2
          ? validateStep2()
          : step === 3
            ? validateStep3()
            : validateStep4();

    if (!valid) return;
    if (step === 3 && !shouldShowBranchStep) {
      void submitRegistration();
      return;
    }
    setStep((current) => Math.min(current + 1, totalSteps));
  }

  async function submitRegistration() {
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) return;

    setIsLoading(true);
    setError(null);

    try {
      const userResult = await signUp({ email, password, name });

      if (userResult.isFailure || !userResult.value) {
        setError(userResult.error?.message ?? "Error al crear usuario");
        return;
      }

      const companyResult = await registerCompany(userResult.value.userId, userResult.value.email, {
        name: companyName,
        businessType,
        companySize,
        usageMode,
        companyMode,
        needsTechniciansModule,
        needsTechnicianPayments,
        ivaPercentage: 19,
        commissionPercentage: needsTechnicianPayments ? 40 : 0,
        mainBranch: {
          name: shouldShowBranchStep ? branchName : "Casa Matriz",
          code: shouldShowBranchStep ? branchCode : "MAT",
          address: branchAddress || undefined,
          email,
        },
      });

      if (!companyResult.success) {
        setError(companyResult.error ?? "Error al registrar empresa");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error inesperado. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step === totalSteps) {
      void submitRegistration();
      return;
    }
    goNext();
  }

  return (
    <div className="rounded-[22px] border border-[#e2e7f5] bg-white p-6 shadow-[0_30px_80px_rgba(44,52,112,0.12)] sm:p-9">
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between text-xs font-black tracking-[0.16em] text-[#7a86a4] uppercase">
          <span>
            Paso {step} de {totalSteps}
          </span>
          <span className="text-[#4f58ff]">{steps[step - 1]}</span>
        </div>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}
        >
          {steps.slice(0, totalSteps).map((label, index) => {
            const isDone = step > index + 1;
            const isActive = step === index + 1;
            return (
              <div
                key={label}
                className={`h-2 rounded-full ${
                  isDone || isActive
                    ? "bg-[linear-gradient(90deg,#4f58ff,#8b56ff)]"
                    : "bg-[#edf0f8]"
                }`}
                aria-label={label}
              />
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-black text-2xl font-black text-white shadow-[0_18px_44px_rgba(16,22,54,0.24)]">
          S
        </div>
        <h1 className="text-center text-3xl font-black tracking-normal text-[#080d2a]">
          Registra tu taller
        </h1>
        <h2 className="mt-5 text-xl font-black text-[#101733]">
          {step === 1 && "Crea tu acceso"}
          {step === 2 && "Configura tu taller"}
          {step === 3 && "Ajusta SISGO a tu operación"}
          {step === 4 && "Sucursal principal"}
        </h2>
        <p className="mt-2 text-sm leading-6 font-medium text-[#6d7899]">
          {companyMode === "solo_owner"
            ? "Modo simple: menos campos, foco en crear órdenes y cobrar."
            : companyMode === "multi_branch"
              ? "Modo multi sucursal: usuarios, locales y reportes separados desde el inicio."
              : "Modo equipo: órdenes, técnicos y pagos listos para crecer."}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="name" className="font-black text-[#101733]">
                Nombre completo
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                className="h-13 rounded-lg border-[#d9deec] bg-white text-base font-medium shadow-[0_8px_24px_rgba(47,56,118,0.05)] placeholder:text-[#8a94ad] focus-visible:border-[#5660ff] focus-visible:ring-[#5660ff]/18"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="email-register" className="font-black text-[#101733]">
                Email
              </Label>
              <Input
                id="email-register"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ej: admin@taller.cl"
                className="h-13 rounded-lg border-[#d9deec] bg-white text-base font-medium shadow-[0_8px_24px_rgba(47,56,118,0.05)] placeholder:text-[#8a94ad] focus-visible:border-[#5660ff] focus-visible:ring-[#5660ff]/18"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="password-register" className="font-black text-[#101733]">
                  Contraseña
                </Label>
                <Input
                  id="password-register"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="h-13 rounded-lg border-[#d9deec] bg-white text-base font-medium shadow-[0_8px_24px_rgba(47,56,118,0.05)] placeholder:text-[#8a94ad] focus-visible:border-[#5660ff] focus-visible:ring-[#5660ff]/18"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="confirm-password" className="font-black text-[#101733]">
                  Confirmar contraseña
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="h-13 rounded-lg border-[#d9deec] bg-white text-base font-medium shadow-[0_8px_24px_rgba(47,56,118,0.05)] placeholder:text-[#8a94ad] focus-visible:border-[#5660ff] focus-visible:ring-[#5660ff]/18"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="company-name" className="font-black text-[#101733]">
                Nombre empresa
              </Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Servicio Técnico Central"
                className="h-13 rounded-lg border-[#d9deec] bg-white text-base font-medium shadow-[0_8px_24px_rgba(47,56,118,0.05)] placeholder:text-[#8a94ad] focus-visible:border-[#5660ff] focus-visible:ring-[#5660ff]/18"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="business-type" className="font-black text-[#101733]">
                Tipo de negocio
              </Label>
              <Select
                value={businessType}
                onValueChange={(value) => setBusinessType(value as BusinessType)}
              >
                <SelectTrigger
                  id="business-type"
                  className="h-13 rounded-lg border-[#d9deec] bg-white text-base font-medium shadow-[0_8px_24px_rgba(47,56,118,0.05)]"
                >
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
            <div className="rounded-lg border border-dashed border-[#d9deec] bg-[#fbfcff] p-4 text-sm font-medium text-[#6d7899]">
              RUT, logo, teléfono y dirección se pueden configurar después desde Ajustes.
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="grid gap-3">
              {sizeOptions.map((option) => {
                const selected = companySize === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-lg border p-4 text-left transition ${
                      selected
                        ? "border-[#5660ff] bg-[#f4f5ff] shadow-[0_12px_28px_rgba(79,88,255,0.12)]"
                        : "border-[#e2e7f5] bg-white hover:bg-[#fbfcff]"
                    }`}
                    onClick={() => {
                      setCompanySize(option.value);
                      if (option.value === "solo") setUsageMode("owner_only");
                      if (option.value === "multi_branch") setUsageMode("team");
                    }}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-black text-[#101733]">{option.title}</span>
                      {selected && <Check className="size-4 text-[#4f58ff]" />}
                    </span>
                    <span className="mt-1 block text-sm font-medium text-[#6d7899]">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                className={`rounded-lg border p-4 text-left transition ${
                  usageMode === "owner_only"
                    ? "border-[#5660ff] bg-[#f4f5ff]"
                    : "border-[#e2e7f5] bg-white hover:bg-[#fbfcff]"
                }`}
                onClick={() => setUsageMode("owner_only")}
                disabled={companySize === "multi_branch"}
              >
                <Users className="mb-2 size-5 text-[#4f58ff]" />
                <span className="font-black text-[#101733]">Dueño solo</span>
                <span className="mt-1 block text-sm font-medium text-[#6d7899]">
                  Menú corto y creación rápida de órdenes.
                </span>
              </button>
              <button
                type="button"
                className={`rounded-lg border p-4 text-left transition ${
                  usageMode === "team"
                    ? "border-[#5660ff] bg-[#f4f5ff]"
                    : "border-[#e2e7f5] bg-white hover:bg-[#fbfcff]"
                }`}
                onClick={() => setUsageMode("team")}
              >
                <Users className="mb-2 size-5 text-[#4f58ff]" />
                <span className="font-black text-[#101733]">Equipo</span>
                <span className="mt-1 block text-sm font-medium text-[#6d7899]">
                  Usuarios, responsables y permisos desde el inicio.
                </span>
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e2e7f5] bg-white p-4">
                <input
                  type="checkbox"
                  className="mt-1 accent-[#4f58ff]"
                  checked={needsTechniciansModule}
                  onChange={(e) => setNeedsTechniciansModule(e.target.checked)}
                />
                <span>
                  <span className="flex items-center gap-2 font-black text-[#101733]">
                    <Wrench className="size-4" /> Técnicos y reparaciones
                  </span>
                  <span className="mt-1 block text-sm font-medium text-[#6d7899]">
                    Tomar órdenes, completar reparaciones y controlar estados.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e2e7f5] bg-white p-4">
                <input
                  type="checkbox"
                  className="mt-1 accent-[#4f58ff]"
                  checked={needsTechnicianPayments}
                  onChange={(e) => setNeedsTechnicianPayments(e.target.checked)}
                />
                <span>
                  <span className="flex items-center gap-2 font-black text-[#101733]">
                    <CreditCard className="size-4" /> Pagos a técnicos
                  </span>
                  <span className="mt-1 block text-sm font-medium text-[#6d7899]">
                    Comisiones, comprobantes y liquidaciones semanales.
                  </span>
                </span>
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#e2e7f5] bg-[#fbfcff] p-4 text-sm font-medium text-[#6d7899]">
              Esta será la primera sucursal. En modo multi sucursal podrás agregar más locales desde
              Configuración.
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="branch-name" className="font-black text-[#101733]">
                  Nombre sucursal
                </Label>
                <Input
                  id="branch-name"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Casa Matriz"
                  className="h-12 rounded-lg border-[#d9deec] bg-white font-medium placeholder:text-[#8a94ad] focus-visible:border-[#5660ff] focus-visible:ring-[#5660ff]/18"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="branch-code" className="font-black text-[#101733]">
                  Código corto
                </Label>
                <Input
                  id="branch-code"
                  value={branchCode}
                  maxLength={5}
                  onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                  placeholder="MAT"
                  className="h-12 rounded-lg border-[#d9deec] bg-white font-medium placeholder:text-[#8a94ad] focus-visible:border-[#5660ff] focus-visible:ring-[#5660ff]/18"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="branch-address" className="font-black text-[#101733]">
                Dirección (opcional)
              </Label>
              <Input
                id="branch-address"
                value={branchAddress}
                onChange={(e) => setBranchAddress(e.target.value)}
                placeholder="Dirección del local"
                className="h-12 rounded-lg border-[#d9deec] bg-white font-medium placeholder:text-[#8a94ad] focus-visible:border-[#5660ff] focus-visible:ring-[#5660ff]/18"
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              className="h-13 flex-1 rounded-lg border-[#d9deec] bg-white font-black text-[#101733] hover:bg-[#fbfcff]"
              onClick={() => setStep((current) => Math.max(current - 1, 1))}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
          )}
          <Button
            type="submit"
            className="h-13 flex-1 rounded-lg bg-[linear-gradient(100deg,#030717_0%,#171950_58%,#2630d9_100%)] font-black text-white shadow-[0_18px_44px_rgba(45,50,150,0.25)] hover:opacity-95"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Registrando..."
              : step === totalSteps
                ? "Activar prueba"
                : step === 3 && !shouldShowBranchStep
                  ? "Activar prueba"
                  : "Siguiente"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
