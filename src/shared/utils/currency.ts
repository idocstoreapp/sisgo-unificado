/**
 * Currency formatting utilities for Chilean Peso (CLP)
 */

/**
 * Format a number as CLP currency (e.g., 15000 -> "$15.000")
 */
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parse a CLP string back to number (e.g., "$15.000" -> 15000)
 */
export function parseCLPInput(value: string): number {
  const cleaned = value.replace(/[$.]/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a number for input display (e.g., 15000 -> "15.000")
 */
export function formatCLPInput(amount: number): string {
  return new Intl.NumberFormat("es-CL").format(Math.round(amount));
}
