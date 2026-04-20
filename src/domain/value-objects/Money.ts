/**
 * Money value object - represents a monetary amount in CLP
 */

import type { ValueObject } from "@/shared/kernel/types";

export class Money implements ValueObject {
  private constructor(private readonly amount: number) {}

  /**
   * Get the raw amount
   */
  getAmount(): number {
    return this.amount;
  }

  /**
   * Check if amount is zero
   */
  isZero(): boolean {
    return this.amount === 0;
  }

  /**
   * Check if amount is positive
   */
  isPositive(): boolean {
    return this.amount > 0;
  }

  /**
   * Check if amount is negative
   */
  isNegative(): boolean {
    return this.amount < 0;
  }

  /**
   * Add another Money amount
   */
  add(other: Money): Money {
    return Money.fromCents(this.amount + other.amount);
  }

  /**
   * Subtract another Money amount
   */
  subtract(other: Money): Money {
    return Money.fromCents(this.amount - other.amount);
  }

  /**
   * Multiply by a factor
   */
  multiply(factor: number): Money {
    return Money.fromCents(Math.round(this.amount * factor));
  }

  /**
   * Calculate percentage of this amount
   * @param percentage - percentage (0-100)
   */
  percentageOf(percentage: number): Money {
    if (percentage < 0 || percentage > 100) {
      throw new Error("Percentage must be between 0 and 100");
    }
    return Money.fromCents(Math.round(this.amount * (percentage / 100)));
  }

  /**
   * Compare with another Money
   */
  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  /**
   * Compare if greater than another Money
   */
  greaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  /**
   * Compare if less than another Money
   */
  lessThan(other: Money): boolean {
    return this.amount < other.amount;
  }

  /**
   * Format as CLP string (e.g., "$15.000")
   */
  toString(): string {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(this.amount);
  }

  /**
   * Format as plain number string (e.g., "15000")
   */
  toPlainString(): string {
    return this.amount.toString();
  }

  /**
   * Create Money from cents (e.g., 15000 cents = $150.00)
   */
  static fromCents(cents: number): Money {
    if (isNaN(cents)) {
      throw new Error("Amount cannot be NaN");
    }
    return new Money(cents);
  }

  /**
   * Create Money from CLP string (e.g., "$15.000" or "15000")
   */
  static fromString(value: string): Money {
    const cleaned = value.replace(/[$.]/g, "").replace(",", ".");
    const amount = Math.round(parseFloat(cleaned));
    if (isNaN(amount)) {
      throw new Error("Invalid money format");
    }
    return new Money(amount);
  }

  /**
   * Zero money
   */
  static zero(): Money {
    return new Money(0);
  }
}
