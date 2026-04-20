/**
 * Company entity tests
 */

import { describe, it, expect } from 'vitest';
import { Company } from '@/domain/entities/Company';
import type { BusinessType } from '@/shared/kernel/types';

describe('Company Entity', () => {
  it('should create a valid company', () => {
    const result = Company.create({
      id: 'test-id',
      name: 'Test Company',
      businessType: 'servicio_tecnico' as BusinessType,
      ivaPercentage: 19,
      commissionPercentage: 40,
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      const company = result.getValue();
      expect(company.id).toBe('test-id');
      expect(company.name).toBe('Test Company');
      expect(company.businessType).toBe('servicio_tecnico');
      expect(company.ivaPercentage).toBe(19);
      expect(company.commissionPercentage).toBe(40);
    }
  });

  it('should fail if name is empty', () => {
    const result = Company.create({
      id: 'test-id',
      name: '',
      businessType: 'servicio_tecnico' as BusinessType,
      ivaPercentage: 19,
      commissionPercentage: 40,
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.getError().message).toContain('name');
    }
  });

  it('should fail if name is too short', () => {
    const result = Company.create({
      id: 'test-id',
      name: 'A',
      businessType: 'servicio_tecnico' as BusinessType,
      ivaPercentage: 19,
      commissionPercentage: 40,
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.getError().code).toBe('NAME_TOO_SHORT');
    }
  });

  it('should update company name', () => {
    const result = Company.create({
      id: 'test-id',
      name: 'Test Company',
      businessType: 'servicio_tecnico' as BusinessType,
      ivaPercentage: 19,
      commissionPercentage: 40,
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      const company = result.getValue();
      const updateResult = company.updateName('New Company Name');
      expect(updateResult.isSuccess).toBe(true);
      expect(company.name).toBe('New Company Name');
    }
  });

  it('should fail to update name if empty', () => {
    const result = Company.create({
      id: 'test-id',
      name: 'Test Company',
      businessType: 'servicio_tecnico' as BusinessType,
      ivaPercentage: 19,
      commissionPercentage: 40,
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      const company = result.getValue();
      const updateResult = company.updateName('');
      expect(updateResult.isFailure).toBe(true);
    }
  });

  it('should update IVA percentage', () => {
    const result = Company.create({
      id: 'test-id',
      name: 'Test Company',
      businessType: 'servicio_tecnico' as BusinessType,
      ivaPercentage: 19,
      commissionPercentage: 40,
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      const company = result.getValue();
      const updateResult = company.updateIvaPercentage(21);
      expect(updateResult.isSuccess).toBe(true);
      expect(company.ivaPercentage).toBe(21);
    }
  });

  it('should fail to update IVA if out of range', () => {
    const result = Company.create({
      id: 'test-id',
      name: 'Test Company',
      businessType: 'servicio_tecnico' as BusinessType,
      ivaPercentage: 19,
      commissionPercentage: 40,
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      const company = result.getValue();
      const updateResult = company.updateIvaPercentage(150);
      expect(updateResult.isFailure).toBe(true);
    }
  });

  it('should set and get config values', () => {
    const result = Company.create({
      id: 'test-id',
      name: 'Test Company',
      businessType: 'servicio_tecnico' as BusinessType,
      ivaPercentage: 19,
      commissionPercentage: 40,
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      const company = result.getValue();
      company.setConfig('maxOrders', 100);
      expect(company.getConfig<number>('maxOrders')).toBe(100);
    }
  });
});
