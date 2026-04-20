/**
 * RegisterCompanyUseCase - creates a company and links the registering user as admin
 */

import { Result, ValidationError, RepositoryError, UnexpectedError } from "@/shared/kernel";
import { Company } from "@/domain/entities/Company";
import { User } from "@/domain/entities/User";
import type { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import type { IUserRepository } from "@/domain/repositories/IUserRepository";
import type { CreateCompanyDTO } from "@/application/dtos/CreateCompanyDTO";
import type { UserOutputDTO, CompanyOutputDTO } from "@/application/dtos/CreateCompanyDTO";

type RegisterCompanyError = ValidationError | RepositoryError | UnexpectedError;

export interface RegisterCompanyResult {
  company: CompanyOutputDTO;
  user: UserOutputDTO;
}

export class RegisterCompanyUseCase {
  constructor(
    private readonly companyRepository: ICompanyRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Execute the use case - create company and admin user
   * @param userId - The auth user ID from Supabase Auth
   * @param userEmail - The auth user email
   * @param input - Company data
   */
  async execute(
    userId: string,
    userEmail: string,
    input: CreateCompanyDTO
  ): Promise<Result<RegisterCompanyResult, RegisterCompanyError>> {
    try {
      // Step 1: Create company with validation
      const companyResult = Company.create({
        id: crypto.randomUUID(),
        name: input.name,
        businessType: input.businessType,
        rut: input.rut,
        razonSocial: input.razonSocial,
        email: input.email,
        phone: input.phone,
        address: input.address,
        ivaPercentage: input.ivaPercentage ?? 19,
        commissionPercentage: input.commissionPercentage ?? 40,
      });

      if (companyResult.isFailure) {
        return Result.fail(companyResult.getError());
      }

      const company = companyResult.getValue();

      // Step 2: Save company to database
      const savedCompanyResult = await this.companyRepository.create(company);
      if (savedCompanyResult.isFailure) {
        return Result.fail(savedCompanyResult.getError());
      }

      const savedCompany = savedCompanyResult.getValue();

      // Step 3: Create admin user linked to the company
      const userResult = User.create({
        id: userId,
        companyId: savedCompany.id,
        role: "super_admin",
        name: userEmail.split("@")[0] ?? userEmail,
        email: userEmail,
        permissions: {},
        sueldoBase: 0,
      });

      if (userResult.isFailure) {
        // Rollback: delete the company
        await this.companyRepository.delete(savedCompany.id);
        return Result.fail(userResult.getError());
      }

      const user = userResult.getValue();

      // Step 4: Save user to database
      const savedUserResult = await this.userRepository.create(user);
      if (savedUserResult.isFailure) {
        // Rollback: delete the company
        await this.companyRepository.delete(savedCompany.id);
        return Result.fail(savedUserResult.getError());
      }

      const savedUser = savedUserResult.getValue();

      // Step 5: Return result as DTOs
      return Result.ok({
        company: this.toCompanyOutput(savedCompany),
        user: this.toUserOutput(savedUser),
      });
    } catch (error) {
      return Result.fail(UnexpectedError.from(error));
    }
  }

  private toCompanyOutput(company: Company): CompanyOutputDTO {
    return {
      id: company.id,
      name: company.name,
      businessType: company.businessType,
      rut: company.rut ?? null,
      razonSocial: company.razonSocial ?? null,
      email: company.email ?? null,
      phone: company.phone ?? null,
      address: company.address ?? null,
      logoUrl: company.logoUrl ?? null,
      ivaPercentage: company.ivaPercentage,
      commissionPercentage: company.commissionPercentage,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt ?? null,
    };
  }

  private toUserOutput(user: User): UserOutputDTO {
    return {
      id: user.id,
      companyId: user.companyId,
      branchId: user.branchId ?? null,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      avatarUrl: user.avatarUrl ?? null,
      permissions: user.permissions,
      commissionPercentage: user.commissionPercentage ?? null,
      sueldoBase: user.sueldoBase,
      sueldoFrecuencia: user.sueldoFrecuencia ?? null,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt ?? null,
    };
  }
}
