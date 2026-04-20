/**
 * Shared constants used across the application
 */

/** Order status display labels */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  en_proceso: "En Proceso",
  por_entregar: "Por Entregar",
  entregada: "Entregada",
  rechazada: "Rechazada",
  sin_solucion: "Sin Solución",
  garantia: "Garantía",
};

/** Order status color classes */
export const ORDER_STATUS_COLORS: Record<string, string> = {
  en_proceso: "bg-yellow-100 text-yellow-800",
  por_entregar: "bg-blue-100 text-blue-800",
  entregada: "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
  sin_solucion: "bg-gray-100 text-gray-800",
  garantia: "bg-purple-100 text-purple-800",
};

/** Priority display labels */
export const PRIORITY_LABELS: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  urgente: "Urgente",
};

/** Priority color classes */
export const PRIORITY_COLORS: Record<string, string> = {
  baja: "bg-blue-100 text-blue-800",
  media: "bg-yellow-100 text-yellow-800",
  urgente: "bg-red-100 text-red-800",
};

/** Business type display labels */
export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  servicio_tecnico: "Servicio Técnico",
  taller_mecanico: "Taller Mecánico",
  muebleria: "Mueblería",
  restaurante: "Restaurante",
};

/** Default commission percentage */
export const DEFAULT_COMMISSION_PERCENTAGE = 40;

/** Default IVA percentage (Chile) */
export const DEFAULT_IVA_PERCENTAGE = 19;

/** Default warranty days */
export const DEFAULT_WARRANTY_DAYS = 30;
