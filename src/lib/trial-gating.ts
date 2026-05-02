export type TrialStatus = "active" | "expired" | "paid";

export interface TrialState {
  status: TrialStatus;
  startedAt: string;
  endsAt: string;
  daysTotal: number;
  daysRemaining: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getTrialDays(companyMode: unknown): number {
  return companyMode === "multi_branch" ? 15 : 7;
}

export function createTrialConfig(companyMode: unknown, now = new Date()) {
  const days = getTrialDays(companyMode);
  return {
    status: "active" as TrialStatus,
    startedAt: now.toISOString(),
    endsAt: new Date(now.getTime() + days * MS_PER_DAY).toISOString(),
    daysTotal: days,
  };
}

export function resolveTrialState(
  config: Record<string, unknown> | null | undefined,
  now = new Date(),
): TrialState | null {
  const trial = config?.trial as Partial<TrialState> | undefined;
  if (!trial?.startedAt || !trial?.endsAt || !trial?.daysTotal) return null;

  const endsAt = new Date(trial.endsAt);
  const daysRemaining = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / MS_PER_DAY));
  const status: TrialStatus =
    trial.status === "paid" ? "paid" : daysRemaining > 0 ? "active" : "expired";

  return {
    status,
    startedAt: trial.startedAt,
    endsAt: trial.endsAt,
    daysTotal: Number(trial.daysTotal),
    daysRemaining,
  };
}

export function isTrialBlocked(config: Record<string, unknown> | null | undefined): boolean {
  return resolveTrialState(config)?.status === "expired";
}

export function isBillingPath(pathname: string): boolean {
  return (
    pathname.startsWith("/billing") ||
    pathname.startsWith("/api/billing")
  );
}

export const TRIAL_BLOCKED_PATHS = [
  "/dashboard",
  "/orders",
  "/quotes",
  "/inventory",
  "/restaurant",
  "/customers",
  "/users",
  "/branches",
  "/finance",
  "/reports",
  "/settings",
] as const;

export function isTrialProtectedPath(pathname: string): boolean {
  if (isBillingPath(pathname)) return false;
  return TRIAL_BLOCKED_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
