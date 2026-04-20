/**
 * Base types used across all layers
 */

/** Base interface for all entities */
export interface BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
}

/** Entity constructor props */
export interface EntityProps {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Value object interface - immutable objects defined by their attributes */
export interface ValueObject {
  equals(other: ValueObject): boolean;
  toString(): string;
}

/** Business types supported by the system */
export type BusinessType =
  | "servicio_tecnico"
  | "taller_mecanico"
  | "muebleria"
  | "restaurante";

/** User roles in the system */
export type UserRole =
  | "super_admin"
  | "admin"
  | "technician"
  | "mechanic"
  | "vendedor"
  | "mesero"
  | "cocina"
  | "encargado"
  | "recepcionista"
  | "responsable";

/** Order status values */
export type OrderStatus =
  | "en_proceso"
  | "por_entregar"
  | "entregada"
  | "rechazada"
  | "sin_solucion"
  | "garantia";

/** Priority levels */
export type Priority = "baja" | "media" | "urgente";

/** Payment methods */
export type PaymentMethod = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";
