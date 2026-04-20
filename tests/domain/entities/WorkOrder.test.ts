/**
 * Domain Entity Tests - WorkOrder
 */

import { describe, it, expect } from 'vitest';
import { WorkOrder } from '@/domain/entities/WorkOrder';
import { ValidationError } from '@/shared/kernel';

describe('WorkOrder Entity', () => {
  it('should create a valid work order', () => {
    const result = WorkOrder.create({
      id: 'test-id',
      companyId: 'company-1',
      customerId: 'customer-1',
      orderNumber: 'OT-2026-0001',
      businessType: 'servicio_tecnico',
      replacementCost: 5000,
      laborCost: 10000,
      totalPrice: 20000,
      warrantyDays: 30,
    });

    expect(result.isSuccess).toBe(true);
    const order = result.getValue();
    expect(order.id).toBe('test-id');
    expect(order.status).toBe('en_proceso');
    expect(order.totalCost).toBe(15000);
    expect(order.isCompleted()).toBe(false);
  });

  it('should fail with negative cost', () => {
    const result = WorkOrder.create({
      id: 'test-id',
      companyId: 'company-1',
      customerId: 'customer-1',
      orderNumber: 'OT-2026-0001',
      businessType: 'servicio_tecnico',
      replacementCost: -100,
      laborCost: 10000,
      totalPrice: 20000,
      warrantyDays: 30,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error?.message).toBe('Replacement cost cannot be negative');
  });

  it('should check if order is in warranty', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const result = WorkOrder.create({
      id: 'test-id',
      companyId: 'company-1',
      customerId: 'customer-1',
      orderNumber: 'OT-2026-0001',
      businessType: 'servicio_tecnico',
      replacementCost: 5000,
      laborCost: 10000,
      totalPrice: 20000,
      warrantyDays: 30,
    });

    const order = result.getValue();
    order.changeStatus('entregada');
    
    expect(order.isInWarranty()).toBe(true);
  });
});
