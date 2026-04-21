/**
 * Dependency Injection Container
 * Simple composition root for wiring up use cases with repositories
 */

import { SupabaseCompanyRepository } from "@/infrastructure/database/supabase/repositories/SupabaseCompanyRepository";
import { SupabaseBranchRepository } from "@/infrastructure/database/supabase/repositories/SupabaseBranchRepository";
import { SupabaseUserRepository } from "@/infrastructure/database/supabase/repositories/SupabaseUserRepository";
import { SupabaseCustomerRepository } from "@/infrastructure/database/supabase/repositories/SupabaseCustomerRepository";
import { SupabaseWorkOrderRepository } from "@/infrastructure/database/supabase/repositories/SupabaseWorkOrderRepository";
import { SupabaseEmployeePaymentRepository } from "@/infrastructure/database/supabase/repositories/SupabaseEmployeePaymentRepository";
import { SupabaseExpenseRepository } from "@/infrastructure/database/supabase/repositories/SupabaseExpenseRepository";
import { SupabaseSavingsFundRepository, SupabaseSalaryAdjustmentRepository } from "@/infrastructure/database/supabase/repositories/SupabaseFinanceRepositories";
import { SupabaseQuoteRepository } from "@/infrastructure/database/supabase/repositories/SupabaseQuoteRepository";
import { SupabaseMaterialRepository, SupabaseServiceRepository, SupabaseFurnitureCatalogRepository } from "@/infrastructure/database/supabase/repositories/SupabaseCatalogRepositories";
import { SupabaseProductRepository, SupabaseStockMovementRepository, SupabaseSupplierRepository, SupabasePurchaseRepository } from "@/infrastructure/database/supabase/repositories/SupabaseInventoryRepositories";
import { RegisterCompanyUseCase } from "@/application/use-cases/RegisterCompanyUseCase";
import { CreateUserUseCase } from "@/application/use-cases/CreateUserUseCase";
import { CreateBranchUseCase } from "@/application/use-cases/CreateBranchUseCase";
import { CreateOrderUseCase } from "@/application/use-cases/CreateOrderUseCase";
import { UpdateOrderStatusUseCase } from "@/application/use-cases/UpdateOrderStatusUseCase";
import { ProcessPaymentUseCase, RecordExpenseUseCase, SavingsFundUseCase, CreateSalaryAdjustmentUseCase, GetFinanceSummaryUseCase } from "@/application/use-cases/FinanceUseCases";
import { CreateQuoteUseCase, UpdateQuoteUseCase, ChangeQuoteStatusUseCase, CreateMaterialUseCase, CreateServiceUseCase, CreateFurnitureCatalogUseCase } from "@/application/use-cases/QuoteUseCases";
import { CreateProductUseCase, UpdateStockUseCase, CreateSupplierUseCase, CreatePurchaseUseCase } from "@/application/use-cases/InventoryUseCases";
import { CreateTableUseCase, CreateMenuItemUseCase, CreateRestaurantOrderUseCase, UpdateIngredientStockUseCase, CreateRecipeUseCase } from "@/application/use-cases/RestaurantUseCases";
import { SupabaseTableRepository, SupabaseMenuCategoryRepository, SupabaseMenuItemRepository, SupabaseRestaurantOrderRepository, SupabaseOrderItemRepository, SupabaseIngredientRepository, SupabaseRecipeRepository } from "@/infrastructure/database/supabase/repositories/SupabaseRestaurantRepositories";

// Repositories (singletons)
const companyRepository = new SupabaseCompanyRepository();
const branchRepository = new SupabaseBranchRepository();
const userRepository = new SupabaseUserRepository();
const customerRepository = new SupabaseCustomerRepository();
const workOrderRepository = new SupabaseWorkOrderRepository();
const employeePaymentRepository = new SupabaseEmployeePaymentRepository();
const expenseRepository = new SupabaseExpenseRepository();
const savingsFundRepository = new SupabaseSavingsFundRepository();
const salaryAdjustmentRepository = new SupabaseSalaryAdjustmentRepository();
const quoteRepository = new SupabaseQuoteRepository();
const materialRepository = new SupabaseMaterialRepository();
const serviceRepository = new SupabaseServiceRepository();
const furnitureRepository = new SupabaseFurnitureCatalogRepository();
const productRepository = new SupabaseProductRepository();
const stockMovementRepository = new SupabaseStockMovementRepository();
const supplierRepository = new SupabaseSupplierRepository();
const purchaseRepository = new SupabasePurchaseRepository();

// Restaurant Repositories
const tableRepository = new SupabaseTableRepository();
const menuCategoryRepository = new SupabaseMenuCategoryRepository();
const menuItemRepository = new SupabaseMenuItemRepository();
const restaurantOrderRepository = new SupabaseRestaurantOrderRepository();
const orderItemRepository = new SupabaseOrderItemRepository();
const ingredientRepository = new SupabaseIngredientRepository();
const recipeRepository = new SupabaseRecipeRepository();

// Use Cases
export const registerCompanyUseCase = new RegisterCompanyUseCase(companyRepository, userRepository, branchRepository);
export const createUserUseCase = new CreateUserUseCase(userRepository);
export const createBranchUseCase = new CreateBranchUseCase(branchRepository);
export const createOrderUseCase = new CreateOrderUseCase(workOrderRepository);
export const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(workOrderRepository);
export const processPaymentUseCase = new ProcessPaymentUseCase(employeePaymentRepository);
export const recordExpenseUseCase = new RecordExpenseUseCase(expenseRepository);
export const savingsFundUseCase = new SavingsFundUseCase(savingsFundRepository);
export const createSalaryAdjustmentUseCase = new CreateSalaryAdjustmentUseCase(salaryAdjustmentRepository);
export const getFinanceSummaryUseCase = new GetFinanceSummaryUseCase(employeePaymentRepository, expenseRepository, savingsFundRepository, salaryAdjustmentRepository);
export const createQuoteUseCase = new CreateQuoteUseCase(quoteRepository);
export const updateQuoteUseCase = new UpdateQuoteUseCase(quoteRepository);
export const changeQuoteStatusUseCase = new ChangeQuoteStatusUseCase(quoteRepository);
export const createMaterialUseCase = new CreateMaterialUseCase(materialRepository);
export const createServiceUseCase = new CreateServiceUseCase(serviceRepository);
export const createFurnitureCatalogUseCase = new CreateFurnitureCatalogUseCase(furnitureRepository);
export const createProductUseCase = new CreateProductUseCase(productRepository, stockMovementRepository);
export const updateStockUseCase = new UpdateStockUseCase(productRepository, stockMovementRepository);
export const createSupplierUseCase = new CreateSupplierUseCase(supplierRepository);
export const createPurchaseUseCase = new CreatePurchaseUseCase(purchaseRepository, productRepository, stockMovementRepository);
export const createTableUseCase = new CreateTableUseCase(tableRepository);
export const createMenuItemUseCase = new CreateMenuItemUseCase(menuItemRepository);
export const createRestaurantOrderUseCase = new CreateRestaurantOrderUseCase(restaurantOrderRepository);
export const updateIngredientStockUseCase = new UpdateIngredientStockUseCase(ingredientRepository);
export const createRecipeUseCase = new CreateRecipeUseCase(recipeRepository);

// Export repositories for direct use when needed
export { 
  companyRepository, 
  branchRepository, 
  userRepository, 
  customerRepository, 
  workOrderRepository, 
  employeePaymentRepository, 
  expenseRepository, 
  savingsFundRepository, 
  salaryAdjustmentRepository, 
  quoteRepository, 
  materialRepository, 
  serviceRepository, 
  furnitureRepository, 
  productRepository, 
  stockMovementRepository, 
  supplierRepository, 
  purchaseRepository,
  tableRepository,
  menuItemRepository,
  restaurantOrderRepository,
  ingredientRepository,
  recipeRepository,
};
