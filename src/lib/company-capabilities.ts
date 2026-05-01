export type CompanyMode = "solo_owner" | "team" | "multi_branch";

export type CompanyCapability =
  | "dashboard"
  | "orders"
  | "quotes"
  | "inventory"
  | "restaurant"
  | "customers"
  | "users"
  | "branches"
  | "finance"
  | "technicianPayments"
  | "reports"
  | "settings";

export type CompanyConfig = unknown;

export interface CompanyCapabilities {
  mode: CompanyMode;
  enabled: Record<CompanyCapability, boolean>;
}

const capabilities: CompanyCapability[] = [
  "dashboard",
  "orders",
  "quotes",
  "inventory",
  "restaurant",
  "customers",
  "users",
  "branches",
  "finance",
  "technicianPayments",
  "reports",
  "settings",
];

const modeDefaults: Record<CompanyMode, CompanyCapability[]> = {
  solo_owner: [
    "dashboard",
    "orders",
    "quotes",
    "inventory",
    "restaurant",
    "customers",
    "finance",
    "reports",
    "settings",
  ],
  team: [
    "dashboard",
    "orders",
    "quotes",
    "inventory",
    "restaurant",
    "customers",
    "users",
    "finance",
    "technicianPayments",
    "reports",
    "settings",
  ],
  multi_branch: [
    "dashboard",
    "orders",
    "quotes",
    "inventory",
    "restaurant",
    "customers",
    "users",
    "branches",
    "finance",
    "technicianPayments",
    "reports",
    "settings",
  ],
};

const capabilityAliases: Record<CompanyCapability, string[]> = {
  dashboard: ["dashboard"],
  orders: ["orders", "work_orders", "workOrders"],
  quotes: ["quotes", "quotations"],
  inventory: ["inventory", "stock"],
  restaurant: ["restaurant", "pos"],
  customers: ["customers", "clients"],
  users: ["users", "team", "staff"],
  branches: ["branches", "multi_branch", "multiBranch"],
  finance: ["finance", "financial"],
  technicianPayments: ["technicianPayments", "technician_payments", "payments"],
  reports: ["reports", "statistics"],
  settings: ["settings", "configuration"],
};

const routeCapabilities: Array<{ prefix: string; capability: CompanyCapability }> = [
  { prefix: "/finance/payments", capability: "technicianPayments" },
  { prefix: "/dashboard", capability: "dashboard" },
  { prefix: "/orders", capability: "orders" },
  { prefix: "/quotes", capability: "quotes" },
  { prefix: "/inventory", capability: "inventory" },
  { prefix: "/restaurant", capability: "restaurant" },
  { prefix: "/customers", capability: "customers" },
  { prefix: "/users", capability: "users" },
  { prefix: "/branches", capability: "branches" },
  { prefix: "/finance", capability: "finance" },
  { prefix: "/reports", capability: "reports" },
  { prefix: "/settings", capability: "settings" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeMode(value: unknown): CompanyMode | null {
  if (value === "solo_owner" || value === "team" || value === "multi_branch") {
    return value;
  }
  return null;
}

function readMode(config: CompanyConfig): CompanyMode {
  if (!isRecord(config)) return "multi_branch";

  return (
    normalizeMode(config.company_mode) ??
    normalizeMode(config.companyMode) ??
    normalizeMode(config.mode) ??
    normalizeMode(config.operating_mode) ??
    normalizeMode(config.operatingMode) ??
    "multi_branch"
  );
}

function readBooleanOverride(config: CompanyConfig, capability: CompanyCapability): boolean | null {
  if (!isRecord(config)) return null;

  const flagContainers = [
    config.capabilities,
    config.feature_flags,
    config.featureFlags,
    config.features,
  ];
  const aliases = capabilityAliases[capability];

  for (const container of flagContainers) {
    if (!isRecord(container)) continue;

    for (const alias of aliases) {
      if (typeof container[alias] === "boolean") {
        return container[alias];
      }
    }
  }

  return null;
}

function applyListOverrides(
  config: CompanyConfig,
  enabled: Record<CompanyCapability, boolean>,
): Record<CompanyCapability, boolean> {
  if (!isRecord(config)) return enabled;

  const next = { ...enabled };
  const enabledModules = Array.isArray(config.enabled_modules)
    ? config.enabled_modules
    : config.enabledModules;
  const disabledModules = Array.isArray(config.disabled_modules)
    ? config.disabled_modules
    : config.disabledModules;

  if (Array.isArray(enabledModules)) {
    for (const value of enabledModules) {
      const capability = findCapability(value);
      if (capability) next[capability] = true;
    }
  }

  if (Array.isArray(disabledModules)) {
    for (const value of disabledModules) {
      const capability = findCapability(value);
      if (capability) next[capability] = false;
    }
  }

  return next;
}

function findCapability(value: unknown): CompanyCapability | null {
  if (typeof value !== "string") return null;

  return (
    capabilities.find((capability) =>
      capabilityAliases[capability].some((alias) => alias.toLowerCase() === value.toLowerCase()),
    ) ?? null
  );
}

export function getCompanyCapabilities(config: CompanyConfig): CompanyCapabilities {
  const mode = readMode(config);
  const defaults = new Set(modeDefaults[mode]);
  let enabled = capabilities.reduce(
    (acc, capability) => {
      acc[capability] = defaults.has(capability);
      return acc;
    },
    {} as Record<CompanyCapability, boolean>,
  );

  for (const capability of capabilities) {
    const override = readBooleanOverride(config, capability);
    if (override !== null) enabled[capability] = override;
  }

  enabled = applyListOverrides(config, enabled);

  return { mode, enabled };
}

export function isCompanyCapabilityEnabled(
  companyCapabilities: CompanyCapabilities,
  capability: CompanyCapability,
): boolean {
  return companyCapabilities.enabled[capability];
}

export function getRouteCapability(pathname: string): CompanyCapability | null {
  const match = routeCapabilities.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return match?.capability ?? null;
}

export function isCompanyRouteEnabled(
  companyCapabilities: CompanyCapabilities,
  pathname: string,
): boolean {
  const capability = getRouteCapability(pathname);
  return capability ? isCompanyCapabilityEnabled(companyCapabilities, capability) : true;
}
