/**
 * Use Cases for Inventory module
 */

import { Result, ValidationError, RepositoryError, UnexpectedError } from "@/shared/kernel";
import { Product } from "@/domain/entities/Product";
import { StockMovement, Supplier, Purchase, PurchaseItem } from "@/domain/entities/Inventory";
import type { IProductRepository } from "@/domain/repositories/IProductRepository";
import type { IStockMovementRepository, ISupplierRepository, IPurchaseRepository } from "@/domain/repositories/IInventoryRepository";
import type {
  CreateProductDTO,
  ProductOutputDTO,
  CreateStockMovementDTO,
  StockMovementOutputDTO,
  CreateSupplierDTO,
  SupplierOutputDTO,
  CreatePurchaseDTO,
  PurchaseOutputDTO,
} from "@/application/dtos/InventoryDTOs";

type UseCaseError = ValidationError | RepositoryError | UnexpectedError;

// ==================== CREATE PRODUCT USE CASE ====================

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly stockMovementRepository: IStockMovementRepository
  ) {}

  async execute(input: CreateProductDTO): Promise<Result<ProductOutputDTO, UseCaseError>> {
    try {
      // Create product entity
      const productResult = Product.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        name: input.name,
        description: input.description,
        category: input.category,
        type: input.type,
        barcode: input.barcode,
        costPrice: input.costPrice,
        salePrice: input.salePrice,
        stock: input.stock ?? 0,
        minStock: input.minStock ?? 5,
        unitType: input.unitType,
        imageUrl: input.imageUrl,
      });

      if (productResult.isFailure) {
        return Result.fail(productResult.getError());
      }

      const product = productResult.getValue();

      // Save product
      const saveResult = await this.productRepository.create(product);
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      const savedProduct = saveResult.getValue();

      // If initial stock > 0, create stock movement
      if (input.stock && input.stock > 0) {
        const movementResult = StockMovement.create({
          id: crypto.randomUUID(),
          companyId: input.companyId,
          productId: savedProduct.id,
          quantity: input.stock,
          direction: "IN",
          reason: "MANUAL",
          notes: "Initial stock",
        });

        if (movementResult.isSuccess) {
          await this.stockMovementRepository.create(movementResult.getValue());
        }
      }

      return Result.ok(this.toProductOutputDTO(savedProduct));
    } catch (error) {
      return Result.fail(new UnexpectedError("Error creating product", { originalError: error }));
    }
  }

  private toProductOutputDTO(product: Product): ProductOutputDTO {
    return {
      id: product.id,
      companyId: product.companyId,
      name: product.name,
      description: product.description,
      category: product.category,
      type: product.type,
      barcode: product.barcode,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      stock: product.stock,
      minStock: product.minStock,
      unitType: product.unitType,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
      isLowStock: product.isLowStock(),
      isOutOfStock: product.isOutOfStock(),
      profitMargin: product.getProfitMargin(),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}

// ==================== UPDATE STOCK USE CASE ====================

export class UpdateStockUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly stockMovementRepository: IStockMovementRepository
  ) {}

  async execute(input: CreateStockMovementDTO): Promise<Result<StockMovementOutputDTO, UseCaseError>> {
    try {
      // Fetch product
      const fetchResult = await this.productRepository.findById(input.productId);
      if (fetchResult.isFailure) {
        return Result.fail(fetchResult.getError());
      }

      let product = fetchResult.getValue();

      // Adjust stock
      const adjustmentResult = product.adjustStock(
        input.direction === "IN" ? input.quantity : -input.quantity,
        input.reason
      );

      if (adjustmentResult.isFailure) {
        return Result.fail(adjustmentResult.getError());
      }

      // Save updated product
      const updateResult = await this.productRepository.update(product);
      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError());
      }

      // Create stock movement
      const movementResult = StockMovement.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        productId: input.productId,
        quantity: input.quantity,
        direction: input.direction,
        reason: input.reason,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
        notes: input.notes,
        performedBy: input.performedBy,
      });

      if (movementResult.isFailure) {
        return Result.fail(movementResult.getError());
      }

      const movement = movementResult.getValue();
      const saveMovementResult = await this.stockMovementRepository.create(movement);

      if (saveMovementResult.isFailure) {
        return Result.fail(saveMovementResult.getError());
      }

      return Result.ok(this.toMovementOutputDTO(movement));
    } catch (error) {
      return Result.fail(new UnexpectedError("Error updating stock", { originalError: error }));
    }
  }

  private toMovementOutputDTO(movement: StockMovement): StockMovementOutputDTO {
    return {
      id: movement.id,
      companyId: movement.companyId,
      productId: movement.productId,
      quantity: movement.quantity,
      direction: movement.direction,
      reason: movement.reason,
      referenceId: movement.referenceId,
      referenceType: movement.referenceType,
      notes: movement.notes,
      performedBy: movement.performedBy,
      createdAt: movement.createdAt,
    };
  }
}

// ==================== CREATE SUPPLIER USE CASE ====================

export class CreateSupplierUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(input: CreateSupplierDTO): Promise<Result<SupplierOutputDTO, UseCaseError>> {
    try {
      const supplierResult = Supplier.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        name: input.name,
        contactInfo: input.contactInfo,
        email: input.email,
        phone: input.phone,
        address: input.address,
        rut: input.rut,
      });

      if (supplierResult.isFailure) {
        return Result.fail(supplierResult.getError());
      }

      const supplier = supplierResult.getValue();
      const saveResult = await this.supplierRepository.create(supplier);

      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      const savedSupplier = saveResult.getValue();
      return Result.ok(this.toSupplierOutputDTO(savedSupplier));
    } catch (error) {
      return Result.fail(new UnexpectedError("Error creating supplier", { originalError: error }));
    }
  }

  private toSupplierOutputDTO(supplier: Supplier): SupplierOutputDTO {
    return {
      id: supplier.id,
      companyId: supplier.companyId,
      name: supplier.name,
      contactInfo: supplier.contactInfo,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      rut: supplier.rut,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    };
  }
}

// ==================== CREATE PURCHASE USE CASE ====================

export class CreatePurchaseUseCase {
  constructor(
    private readonly purchaseRepository: IPurchaseRepository,
    private readonly productRepository: IProductRepository,
    private readonly stockMovementRepository: IStockMovementRepository
  ) {}

  async execute(input: CreatePurchaseDTO): Promise<Result<PurchaseOutputDTO, UseCaseError>> {
    try {
      // Calculate total
      const total = input.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

      // Create purchase entity
      const purchaseResult = Purchase.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        supplierId: input.supplierId,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate,
        total,
        paymentMethod: input.paymentMethod,
        notes: input.notes,
      });

      if (purchaseResult.isFailure) {
        return Result.fail(purchaseResult.getError());
      }

      const purchase = purchaseResult.getValue();

      // Save purchase (items would be saved in a real implementation)
      const saveResult = await this.purchaseRepository.create(purchase);
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      const savedPurchase = saveResult.getValue();

      // Update stock for each item
      for (const item of input.items) {
        if (item.productId) {
          // Update product stock
          const productFetchResult = await this.productRepository.findById(item.productId);
          if (productFetchResult.isSuccess) {
            let product = productFetchResult.getValue();
            await product.adjustStock(item.quantity, "Purchase stock update");
            await this.productRepository.update(product);

            // Create stock movement
            const movementResult = StockMovement.create({
              id: crypto.randomUUID(),
              companyId: input.companyId,
              productId: item.productId,
              quantity: item.quantity,
              direction: "IN",
              reason: "PURCHASE",
              referenceId: savedPurchase.id,
              referenceType: "purchase",
              notes: `From purchase: ${item.name}`,
            });

            if (movementResult.isSuccess) {
              await this.stockMovementRepository.create(movementResult.getValue());
            }
          }
        }
      }

      return Result.ok(this.toPurchaseOutputDTO(savedPurchase));
    } catch (error) {
      return Result.fail(new UnexpectedError("Error creating purchase", { originalError: error }));
    }
  }

  private toPurchaseOutputDTO(purchase: Purchase): PurchaseOutputDTO {
    return {
      id: purchase.id,
      companyId: purchase.companyId,
      supplierId: purchase.supplierId,
      invoiceNumber: purchase.invoiceNumber,
      invoiceDate: purchase.invoiceDate,
      total: purchase.total,
      paymentMethod: purchase.paymentMethod,
      status: purchase.status,
      notes: purchase.notes,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
    };
  }
}
