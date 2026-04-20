/**
 * Email value object - represents a validated email address
 */

import type { ValueObject } from "@/shared/kernel/types";

export class Email implements ValueObject {
  private constructor(private readonly value: string) {}

  /**
   * Get the email string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Get the domain part of the email
   */
  getDomain(): string {
    const parts = this.value.split("@");
    return parts[1] ?? "";
  }

  /**
   * Get the local part of the email (before @)
   */
  getLocalPart(): string {
    const parts = this.value.split("@");
    return parts[0] ?? "";
  }

  /**
   * Check if equals another email
   */
  equals(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * Create a validated Email
   */
  static create(value: string): Email {
    const trimmed = value.trim().toLowerCase();
    if (!Email.isValid(trimmed)) {
      throw new Error("Invalid email format");
    }
    return new Email(trimmed);
  }

  /**
   * Try to create an Email, return null if invalid
   */
  static tryCreate(value: string): Email | null {
    const trimmed = value.trim().toLowerCase();
    if (!Email.isValid(trimmed)) {
      return null;
    }
    return new Email(trimmed);
  }

  /**
   * Validate email format
   */
  private static isValid(email: string): boolean {
    // Simple but effective email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length > 5 && email.length < 254;
  }
}
