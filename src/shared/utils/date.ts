/**
 * Date formatting utilities using date-fns
 */

import { format, formatDistanceToNow, isValid } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Format date to locale string (e.g., "13 de abril de 2026")
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (!isValid(dateObj)) return "Fecha inválida";
  return format(dateObj, "d 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Format date and time (e.g., "13/04/2026 14:30")
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (!isValid(dateObj)) return "Fecha inválida";
  return format(dateObj, "dd/MM/yyyy HH:mm", { locale: es });
}

/**
 * Format relative time (e.g., "hace 2 horas")
 */
export function formatRelative(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (!isValid(dateObj)) return "Fecha inválida";
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: es });
}

/**
 * Format date for input fields (e.g., "2026-04-13")
 */
export function formatDateInput(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (!isValid(dateObj)) return "";
  return format(dateObj, "yyyy-MM-dd");
}

/**
 * Get start of week (Saturday to Friday, Chilean style)
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Saturday = 6, so go back to previous Saturday
  const diff = day >= 6 ? day - 6 : day + 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
