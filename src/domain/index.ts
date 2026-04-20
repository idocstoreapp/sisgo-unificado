/**
 * Domain layer exports
 */

export { Company, type CompanyProps } from "./entities/Company";
export { Branch, type BranchProps } from "./entities/Branch";
export { User, type UserProps } from "./entities/User";
export { Customer, type CustomerProps } from "./entities/Customer";
export { WorkOrder, type WorkOrderProps } from "./entities/WorkOrder";
export { EmployeePayment, type EmployeePaymentProps } from "./entities/EmployeePayment";
export { Expense, type ExpenseProps } from "./entities/Expense";
export { SavingsFund, type SavingsFundProps } from "./entities/SavingsFund";
export { SalaryAdjustment, type SalaryAdjustmentProps } from "./entities/SalaryAdjustment";
export { Money } from "./value-objects/Money";
export { Email } from "./value-objects/Email";
export { Phone } from "./value-objects/Phone";

// Repository interfaces
export type { ICompanyRepository } from "./repositories/ICompanyRepository";
export type { IBranchRepository } from "./repositories/IBranchRepository";
export type { IUserRepository } from "./repositories/IUserRepository";
export type { ICustomerRepository } from "./repositories/ICustomerRepository";
export type { IWorkOrderRepository, OrderFilters } from "./repositories/IWorkOrderRepository";
export type { IEmployeePaymentRepository } from "./repositories/IEmployeePaymentRepository";
export type { IExpenseRepository } from "./repositories/IExpenseRepository";
export type { ISavingsFundRepository } from "./repositories/ISavingsFundRepository";
export type { ISalaryAdjustmentRepository } from "./repositories/ISalaryAdjustmentRepository";
