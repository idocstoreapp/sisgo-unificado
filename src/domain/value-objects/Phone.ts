/**
 * Phone value object - represents a validated phone number with country code
 */

import type { ValueObject } from "@/shared/kernel/types";

export class Phone implements ValueObject {
  private constructor(
    private readonly number: string,
    private readonly countryCode: string
  ) {}

  /**
   * Get the phone number
   */
  getNumber(): string {
    return this.number;
  }

  /**
   * Get the country code
   */
  getCountryCode(): string {
    return this.countryCode;
  }

  /**
   * Get full phone number with country code (e.g., "+56962614851")
   */
  getFullNumber(): string {
    return `${this.countryCode}${this.number}`;
  }

  /**
   * Format for display (e.g., "+56 9 6261 4851")
   */
  toString(): string {
    // Try to format nicely for Chilean numbers
    if (this.countryCode === "+56" && this.number.length === 9) {
      return `${this.countryCode} ${this.number.slice(0, 1)} ${this.number.slice(1, 5)} ${this.number.slice(5)}`;
    }
    return `${this.countryCode} ${this.number}`;
  }

  /**
   * Check if equals another phone
   */
  equals(other: Phone): boolean {
    return this.getFullNumber() === other.getFullNumber();
  }

  /**
   * Create a validated Phone
   */
  static create(number: string, countryCode: string = "+56"): Phone {
    const cleanedNumber = Phone.cleanNumber(number);
    const cleanedCountryCode = countryCode.trim();

    if (!Phone.isValidNumber(cleanedNumber)) {
      throw new Error("Invalid phone number format");
    }

    return new Phone(cleanedNumber, cleanedCountryCode);
  }

  /**
   * Try to create a Phone, return null if invalid
   */
  static tryCreate(number: string, countryCode: string = "+56"): Phone | null {
    try {
      return Phone.create(number, countryCode);
    } catch {
      return null;
    }
  }

  /**
   * Clean phone number (remove spaces, dashes, parentheses)
   */
  private static cleanNumber(number: string): string {
    return number.replace(/[\s\-\(\)]/g, "");
  }

  /**
   * Validate phone number format
   */
  private static isValidNumber(number: string): boolean {
    // Must contain only digits
    if (!/^\d+$/.test(number)) {
      return false;
    }
    // Reasonable length (7-15 digits)
    return number.length >= 7 && number.length <= 15;
  }
}
