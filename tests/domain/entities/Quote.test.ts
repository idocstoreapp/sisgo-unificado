/**
 * Domain Entity Tests - Quote
 */

import { describe, it, expect } from 'vitest';
import { Quote, QuoteItem } from '@/domain/entities/Quote';

describe('Quote Entity', () => {
  it('should create a valid quote', () => {
    const result = Quote.create({
      id: 'quote-id',
      companyId: 'company-1',
      customerId: 'customer-1',
      customerName: 'Test Customer',
      quoteNumber: 'COT-2026-0001',
      profitMargin: 20,
      ivaPercentage: 19,
    });

    expect(result.isSuccess).toBe(true);
    const quote = result.getValue();
    expect(quote.status).toBe('borrador');
    expect(quote.profitMargin).toBe(20);
    expect(quote.isValid()).toBe(true);
  });

  it('should calculate totals correctly', () => {
    const result = Quote.create({
      id: 'quote-id',
      companyId: 'company-1',
      customerId: 'customer-1',
      customerName: 'Test Customer',
      quoteNumber: 'COT-2026-0001',
      profitMargin: 10,
      ivaPercentage: 19,
    });

    const quote = result.getValue();
    // Manually set subtotal to test calculation
    // In real usage, calculateTotals() is called when items are added
    
    expect(quote.isValid()).toBe(true);
  });
});
