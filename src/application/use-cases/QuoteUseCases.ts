/**
 * Use Cases for Quote module
 */

import { Result, ValidationError, RepositoryError, UnexpectedError } from "@/shared/kernel";
import { Quote, QuoteItem } from "@/domain/entities/Quote";
import { Material } from "@/domain/entities/Material";
import { Service } from "@/domain/entities/Service";
import { FurnitureCatalog, FurnitureVariant } from "@/domain/entities/FurnitureCatalog";
import type { IQuoteRepository } from "@/domain/repositories/IQuoteRepository";
import type { IMaterialRepository } from "@/domain/repositories/IMaterialRepository";
import type { ServiceRepository } from "@/domain/repositories/IServiceRepository";
import type { FurnitureCatalogRepository } from "@/domain/repositories/IFurnitureCatalogRepository";
import type {
  CreateQuoteDTO,
  UpdateQuoteDTO,
  QuoteOutputDTO,
  CreateMaterialDTO,
  MaterialOutputDTO,
  CreateServiceDTO,
  ServiceOutputDTO,
  CreateFurnitureDTO,
  FurnitureOutputDTO,
} from "@/application/dtos/QuoteDTOs";

type UseCaseError = ValidationError | RepositoryError | UnexpectedError;

// ==================== CREATE QUOTE USE CASE ====================

export class CreateQuoteUseCase {
  constructor(private readonly quoteRepository: IQuoteRepository) {}

  async execute(input: CreateQuoteDTO): Promise<Result<QuoteOutputDTO, UseCaseError>> {
    try {
      // Step 1: Generate quote number
      const quoteNumberResult = await this.quoteRepository.getNextQuoteNumber(input.companyId);
      if (quoteNumberResult.isFailure) {
        return Result.fail(quoteNumberResult.getError());
      }
      const quoteNumber = quoteNumberResult.getValue();

      // Step 2: Create quote items
      const quoteItems: QuoteItem[] = [];
      let subtotal = 0;

      for (const itemDto of input.items) {
        const itemResult = QuoteItem.create({
          id: crypto.randomUUID(),
          quoteId: "", // Will be set when added to quote
          itemType: itemDto.itemType,
          name: itemDto.name,
          description: itemDto.description,
          quantity: itemDto.quantity,
          unitPrice: itemDto.unitPrice,
          metadata: itemDto.metadata,
        });

        if (itemResult.isFailure) {
          return Result.fail(itemResult.getError());
        }

        const item = itemResult.getValue();
        quoteItems.push(item);
        subtotal += item.totalPrice;
      }

      // Step 3: Create quote entity
      const profitMargin = input.profitMargin ?? 0;
      const ivaPercentage = input.ivaPercentage ?? 19;
      const profitAmount = subtotal * (profitMargin / 100);
      const subtotalWithMargin = subtotal + profitAmount;
      const ivaAmount = subtotalWithMargin * (ivaPercentage / 100);
      const total = subtotalWithMargin + ivaAmount;

      const quoteResult = Quote.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        branchId: input.branchId,
        customerId: input.customerId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        quoteNumber,
        profitMargin,
        ivaPercentage,
        profitAmount,
        ivaAmount,
        subtotal,
        total,
        notes: input.notes,
        terms: input.terms,
        validUntil: input.validUntil,
        items: quoteItems,
      });

      if (quoteResult.isFailure) {
        return Result.fail(quoteResult.getError());
      }

      const quote = quoteResult.getValue();

      // Step 4: Save quote
      const saveResult = await this.quoteRepository.create(quote);
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      const savedQuote = saveResult.getValue();
      return Result.ok(this.toOutputDTO(savedQuote));
    } catch (error) {
      return Result.fail(new UnexpectedError("Error creating quote", { originalError: error }));
    }
  }

  private toOutputDTO(quote: Quote): QuoteOutputDTO {
    return {
      id: quote.id,
      companyId: quote.companyId,
      branchId: quote.branchId,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      items: quote.items.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      subtotal: quote.subtotal,
      ivaPercentage: quote.ivaPercentage,
      ivaAmount: quote.ivaAmount,
      profitMargin: quote.profitMargin,
      profitAmount: quote.profitAmount,
      total: quote.total,
      notes: quote.notes,
      terms: quote.terms,
      validUntil: quote.validUntil,
      approvedAt: quote.approvedAt,
      rejectedAt: quote.rejectedAt,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    };
  }
}

// ==================== UPDATE QUOTE USE CASE ====================

export class UpdateQuoteUseCase {
  constructor(private readonly quoteRepository: IQuoteRepository) {}

  async execute(input: UpdateQuoteDTO): Promise<Result<QuoteOutputDTO, UseCaseError>> {
    try {
      // Step 1: Fetch existing quote
      const fetchResult = await this.quoteRepository.findById(input.id);
      if (fetchResult.isFailure) {
        return Result.fail(fetchResult.getError());
      }

      let quote = fetchResult.getValue();

      // Step 2: Update basic fields if provided
      if (input.customerId) {
        // Would need to add setter methods to Quote entity
        // For now, we'll just recalculate totals
      }

      if (input.profitMargin !== undefined) {
        const marginResult = quote.updateProfitMargin(input.profitMargin);
        if (marginResult.isFailure) {
          return Result.fail(marginResult.getError());
        }
      }

      if (input.ivaPercentage !== undefined) {
        const ivaResult = quote.updateIvaPercentage(input.ivaPercentage);
        if (ivaResult.isFailure) {
          return Result.fail(ivaResult.getError());
        }
      }

      // Step 3: Save updated quote
      const saveResult = await this.quoteRepository.update(quote);
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      const updatedQuote = saveResult.getValue();
      return Result.ok(this.toOutputDTO(updatedQuote));
    } catch (error) {
      return Result.fail(new UnexpectedError("Error updating quote", { originalError: error }));
    }
  }

  private toOutputDTO(quote: Quote): QuoteOutputDTO {
    return {
      id: quote.id,
      companyId: quote.companyId,
      branchId: quote.branchId,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      items: quote.items.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      subtotal: quote.subtotal,
      ivaPercentage: quote.ivaPercentage,
      ivaAmount: quote.ivaAmount,
      profitMargin: quote.profitMargin,
      profitAmount: quote.profitAmount,
      total: quote.total,
      notes: quote.notes,
      terms: quote.terms,
      validUntil: quote.validUntil,
      approvedAt: quote.approvedAt,
      rejectedAt: quote.rejectedAt,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    };
  }
}

// ==================== CHANGE QUOTE STATUS USE CASE ====================

export class ChangeQuoteStatusUseCase {
  constructor(private readonly quoteRepository: IQuoteRepository) {}

  async execute(
    quoteId: string,
    newStatus: Quote["status"]
  ): Promise<Result<QuoteOutputDTO, UseCaseError>> {
    try {
      // Step 1: Fetch quote
      const fetchResult = await this.quoteRepository.findById(quoteId);
      if (fetchResult.isFailure) {
        return Result.fail(fetchResult.getError());
      }

      let quote = fetchResult.getValue();

      // Step 2: Change status
      const statusResult = quote.changeStatus(newStatus);
      if (statusResult.isFailure) {
        return Result.fail(statusResult.getError());
      }

      // Step 3: Save updated quote
      const saveResult = await this.quoteRepository.update(quote);
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      const updatedQuote = saveResult.getValue();
      return Result.ok(this.toOutputDTO(updatedQuote));
    } catch (error) {
      return Result.fail(new UnexpectedError("Error changing quote status", { originalError: error }));
    }
  }

  private toOutputDTO(quote: Quote): QuoteOutputDTO {
    return {
      id: quote.id,
      companyId: quote.companyId,
      branchId: quote.branchId,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      items: quote.items.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      subtotal: quote.subtotal,
      ivaPercentage: quote.ivaPercentage,
      ivaAmount: quote.ivaAmount,
      profitMargin: quote.profitMargin,
      profitAmount: quote.profitAmount,
      total: quote.total,
      notes: quote.notes,
      terms: quote.terms,
      validUntil: quote.validUntil,
      approvedAt: quote.approvedAt,
      rejectedAt: quote.rejectedAt,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    };
  }
}

// ==================== CREATE MATERIAL USE CASE ====================

export class CreateMaterialUseCase {
  constructor(private readonly materialRepository: IMaterialRepository) {}

  async execute(input: CreateMaterialDTO): Promise<Result<MaterialOutputDTO, UseCaseError>> {
    try {
      const materialResult = Material.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        name: input.name,
        description: input.description,
        category: input.category,
        unitType: input.unitType,
        costPrice: input.costPrice,
        salePrice: input.salePrice,
        currentStock: input.currentStock ?? 0,
        minStock: input.minStock ?? 5,
        supplierId: input.supplierId,
        imageUrl: input.imageUrl,
      });

      if (materialResult.isFailure) {
        return Result.fail(materialResult.getError());
      }

      const material = materialResult.getValue();
      const saveResult = await this.materialRepository.create(material);

      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      const savedMaterial = saveResult.getValue();
      return Result.ok(this.toOutputDTO(savedMaterial));
    } catch (error) {
      return Result.fail(new UnexpectedError("Error creating material", { originalError: error }));
    }
  }

  private toOutputDTO(material: Material): MaterialOutputDTO {
    return {
      id: material.id,
      companyId: material.companyId,
      name: material.name,
      description: material.description,
      category: material.category,
      unitType: material.unitType,
      costPrice: material.costPrice,
      salePrice: material.salePrice,
      currentStock: material.currentStock,
      minStock: material.minStock,
      supplierId: material.supplierId,
      imageUrl: material.imageUrl,
      isActive: material.isActive,
      isLowStock: material.isLowStock(),
      profitMargin: material.getProfitMargin(),
      createdAt: material.createdAt,
      updatedAt: material.updatedAt,
    };
  }
}

// ==================== CREATE SERVICE USE CASE ====================

export class CreateServiceUseCase {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute(input: CreateServiceDTO): Promise<Result<ServiceOutputDTO, UseCaseError>> {
    try {
      const serviceResult = Service.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        name: input.name,
        description: input.description,
        category: input.category,
        pricePerHour: input.pricePerHour,
        estimatedHours: input.estimatedHours,
        imageUrl: input.imageUrl,
      });

      if (serviceResult.isFailure) {
        return Result.fail(serviceResult.getError());
      }

      const service = serviceResult.getValue();
      const saveResult = await this.serviceRepository.create(service);

      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      const savedService = saveResult.getValue();
      return Result.ok(this.toOutputDTO(savedService));
    } catch (error) {
      return Result.fail(new UnexpectedError("Error creating service", { originalError: error }));
    }
  }

  private toOutputDTO(service: Service): ServiceOutputDTO {
    return {
      id: service.id,
      companyId: service.companyId,
      name: service.name,
      description: service.description,
      category: service.category,
      pricePerHour: service.pricePerHour,
      estimatedHours: service.estimatedHours,
      imageUrl: service.imageUrl,
      isActive: service.isActive,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}

// ==================== CREATE FURNITURE CATALOG USE CASE ====================

export class CreateFurnitureCatalogUseCase {
  constructor(private readonly furnitureRepository: FurnitureCatalogRepository) {}

  async execute(input: CreateFurnitureDTO): Promise<Result<FurnitureOutputDTO, UseCaseError>> {
    try {
      // Create variants
      const variants: FurnitureVariant[] = [];
      for (const variantDto of input.variants ?? []) {
        const variantResult = FurnitureVariant.create({
          id: crypto.randomUUID(),
          furnitureId: "", // Will be set when added to furniture
          name: variantDto.name,
          dimensions: variantDto.dimensions,
          color: variantDto.color,
          material: variantDto.material,
          additionalCost: variantDto.additionalCost,
        });

        if (variantResult.isFailure) {
          return Result.fail(variantResult.getError());
        }

        variants.push(variantResult.getValue());
      }

      // Create furniture entity
      const furnitureResult = FurnitureCatalog.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        name: input.name,
        description: input.description,
        category: input.category,
        basePrice: input.basePrice,
        baseMaterialsCost: input.baseMaterialsCost,
        baseLaborHours: input.baseLaborHours,
        imageUrl: input.imageUrl,
        variants,
      });

      if (furnitureResult.isFailure) {
        return Result.fail(furnitureResult.getError());
      }

      const furniture = furnitureResult.getValue();
      const saveResult = await this.furnitureRepository.create(furniture);

      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      const savedFurniture = saveResult.getValue();
      return Result.ok(this.toOutputDTO(savedFurniture));
    } catch (error) {
      return Result.fail(new UnexpectedError("Error creating furniture catalog", { originalError: error }));
    }
  }

  private toOutputDTO(furniture: FurnitureCatalog): FurnitureOutputDTO {
    return {
      id: furniture.id,
      companyId: furniture.companyId,
      name: furniture.name,
      description: furniture.description,
      category: furniture.category,
      basePrice: furniture.basePrice,
      baseMaterialsCost: furniture.baseMaterialsCost,
      baseLaborHours: furniture.baseLaborHours,
      imageUrl: furniture.imageUrl,
      variants: furniture.variants.map((v) => ({
        id: v.id,
        name: v.name,
        dimensions: v.dimensions,
        color: v.color,
        material: v.material,
        additionalCost: v.additionalCost,
        isActive: v.isActive,
      })),
      isActive: furniture.isActive,
      profitMargin: furniture.getProfitMargin(),
      createdAt: furniture.createdAt,
      updatedAt: furniture.updatedAt,
    };
  }
}
