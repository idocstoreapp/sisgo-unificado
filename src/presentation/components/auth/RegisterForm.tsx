/**
 * Adaptive registration wizard for company onboarding.
 */

"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, CreditCard, Users, Wrench } from "lucide-react";
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
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [rut, setRut] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  const [companySize, setCompanySize] = useState<CompanySize>("solo");
  const [usageMode, setUsageMode] = useState<CompanyUsageMode>("owner_only");
  const [needsTechniciansModule, setNeedsTechniciansModule] = useState(true);
  const [needsTechnicianPayments, setNeedsTechnicianPayments] = useState(false);

  const [branchName, setBranchName] = useState("Casa Matriz");
  const [branchCode, setBranchCode] = useState("MAT");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchPhone, setBranchPhone] = useState("");

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

  function handleLogoFile(file: File | null) {
    setError(null);
    setLogoPreview(null);

    if (!file) return;
    if (file.type !== "image/png") {
      setError("El logo debe ser PNG para mantener buena calidad en documentos.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("Usa un PNG de hasta 1 MB.");
      return;
    }

    setLogoPreview(URL.createObjectURL(file));
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
        logoUrl: logoUrl || undefined,
        companySize,
        usageMode,
        companyMode,
        needsTechniciansModule,
        needsTechnicianPayments,
        rut: rut || undefined,
        email,
        phone: companyPhone || undefined,
        address: companyAddress || undefined,
        ivaPercentage: 19,
        commissionPercentage: needsTechnicianPayments ? 40 : 0,
        mainBranch: {
          name: shouldShowBranchStep ? branchName : "Casa Matriz",
          code: shouldShowBranchStep ? branchCode : "MAT",
          phone: branchPhone || companyPhone || undefined,
          address: branchAddress || companyAddress || undefined,
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
    <div className="border-border bg-card rounded-xl border p-5 shadow-sm md:p-6">
      <div className="mb-6">
        <div className="text-muted-foreground mb-3 flex items-center justify-between text-xs font-medium">
          <span>
            Paso {step} de {totalSteps}
          </span>
          <span className="text-primary">{steps[step - 1]}</span>
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
                className={`h-2 rounded-full ${isDone || isActive ? "bg-primary" : "bg-muted"}`}
                aria-label={label}
              />
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-card-foreground text-xl font-semibold">
          {step === 1 && "Crea tu acceso"}
          {step === 2 && "Configura tu taller"}
          {step === 3 && "Ajusta SISGO a tu operación"}
          {step === 4 && "Sucursal principal"}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {companyMode === "solo_owner"
            ? "Modo simple: menos campos, foco en crear órdenes y cobrar."
            : companyMode === "multi_branch"
              ? "Modo multi sucursal: usuarios, locales y reportes separados desde el inicio."
              : "Modo equipo: órdenes, técnicos y pagos listos para crecer."}
        </p>
      </div>

      {error && (
        <div className="border-destructive/20 bg-destructive/10 text-destructive mb-6 rounded-lg border p-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-register">Email</Label>
              <Input
                id="email-register"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password-register">Contraseña</Label>
                <Input
                  id="password-register"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nombre empresa</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Servicio Técnico Central"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-type">Tipo de negocio</Label>
              <Select
                value={businessType}
                onValueChange={(value) => setBusinessType(value as BusinessType)}
              >
                <SelectTrigger id="business-type">
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
            <div className="border-border rounded-lg border border-dashed p-4">
              <div className="flex items-start gap-3">
                <div className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt="Vista previa del logo"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Building2 className="text-muted-foreground size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <Label htmlFor="logo-file">Logo PNG</Label>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Recomendado: PNG transparente, cuadrado, hasta 1 MB. Podrás cambiarlo luego.
                    </p>
                  </div>
                  <Input
                    id="logo-file"
                    type="file"
                    accept="image/png"
                    onChange={(e) => handleLogoFile(e.target.files?.[0] ?? null)}
                  />
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="URL del logo si ya está publicado"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="12.345.678-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-phone">Teléfono</Label>
                <Input
                  id="company-phone"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-address">Dirección</Label>
                <Input
                  id="company-address"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Calle 123"
                />
              </div>
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
                    className={`rounded-lg border p-4 text-left transition ${selected ? "border-primary bg-primary/10" : "border-border hover:bg-accent"}`}
                    onClick={() => {
                      setCompanySize(option.value);
                      if (option.value === "solo") setUsageMode("owner_only");
                      if (option.value === "multi_branch") setUsageMode("team");
                    }}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-medium">{option.title}</span>
                      {selected && <Check className="text-primary size-4" />}
                    </span>
                    <span className="text-muted-foreground mt-1 block text-sm">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                className={`rounded-lg border p-4 text-left ${usageMode === "owner_only" ? "border-primary bg-primary/10" : "border-border hover:bg-accent"}`}
                onClick={() => setUsageMode("owner_only")}
                disabled={companySize === "multi_branch"}
              >
                <Users className="text-primary mb-2 size-5" />
                <span className="font-medium">Dueño solo</span>
                <span className="text-muted-foreground mt-1 block text-sm">
                  Menú corto y creación rápida de órdenes.
                </span>
              </button>
              <button
                type="button"
                className={`rounded-lg border p-4 text-left ${usageMode === "team" ? "border-primary bg-primary/10" : "border-border hover:bg-accent"}`}
                onClick={() => setUsageMode("team")}
              >
                <Users className="text-primary mb-2 size-5" />
                <span className="font-medium">Equipo</span>
                <span className="text-muted-foreground mt-1 block text-sm">
                  Usuarios, responsables y permisos desde el inicio.
                </span>
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="border-border flex cursor-pointer items-start gap-3 rounded-lg border p-4">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={needsTechniciansModule}
                  onChange={(e) => setNeedsTechniciansModule(e.target.checked)}
                />
                <span>
                  <span className="flex items-center gap-2 font-medium">
                    <Wrench className="size-4" /> Técnicos y reparaciones
                  </span>
                  <span className="text-muted-foreground mt-1 block text-sm">
                    Tomar órdenes, completar reparaciones y controlar estados.
                  </span>
                </span>
              </label>
              <label className="border-border flex cursor-pointer items-start gap-3 rounded-lg border p-4">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={needsTechnicianPayments}
                  onChange={(e) => setNeedsTechnicianPayments(e.target.checked)}
                />
                <span>
                  <span className="flex items-center gap-2 font-medium">
                    <CreditCard className="size-4" /> Pagos a técnicos
                  </span>
                  <span className="text-muted-foreground mt-1 block text-sm">
                    Comisiones, comprobantes y liquidaciones semanales.
                  </span>
                </span>
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-muted/50 text-muted-foreground rounded-lg p-4 text-sm">
              Esta será la primera sucursal. En modo multi sucursal podrás agregar más locales desde
              Configuración.
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="branch-name">Nombre sucursal</Label>
                <Input
                  id="branch-name"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Casa Matriz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-code">Código corto</Label>
                <Input
                  id="branch-code"
                  value={branchCode}
                  maxLength={5}
                  onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                  placeholder="MAT"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="branch-phone">Teléfono</Label>
                <Input
                  id="branch-phone"
                  value={branchPhone}
                  onChange={(e) => setBranchPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-address">Dirección</Label>
                <Input
                  id="branch-address"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="Dirección del local"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep((current) => Math.max(current - 1, 1))}
              disabled={isSubmitting}
            >
              Atrás
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting
              ? "Registrando..."
              : step === totalSteps
                ? "Activar prueba"
                : step === 3 && !shouldShowBranchStep
                  ? "Activar prueba"
                  : "Siguiente"}
          </Button>
        </div>
      </form>
    </div>
  );
}
