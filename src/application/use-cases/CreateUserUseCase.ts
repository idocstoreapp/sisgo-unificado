/**
 * CreateUserUseCase - creates a new user in a company
 */

import { Result, ValidationError, BusinessRuleError, RepositoryError, UnexpectedError } from "@/shared/kernel";
import { User } from "@/domain/entities/User";
import type { IUserRepository } from "@/domain/repositories/IUserRepository";
import type { CreateUserDTO } from "@/application/dtos/CreateCompanyDTO";
import type { UserOutputDTO } from "@/application/dtos/CreateCompanyDTO";

type CreateUserError = ValidationError | BusinessRuleError | RepositoryError | UnexpectedError;

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: CreateUserDTO): Promise<Result<UserOutputDTO, CreateUserError>> {
    try {
      // Step 1: Validate unique email within company
      const existingUserResult = await this.userRepository.findByEmailAndCompany(input.email, input.companyId);
      if (existingUserResult.isSuccess && existingUserResult.getValue()) {
        return Result.fail(new ValidationError("A user with this email already exists in the company", "EMAIL_ALREADY_EXISTS"));
      }

      // Step 2: Create user entity with validation
      const userResult = User.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        branchId: input.branchId,
        role: input.role,
        name: input.name,
        email: input.email,
        phone: input.phone,
        permissions: input.permissions ?? {},
        commissionPercentage: input.commissionPercentage,
        sueldoBase: input.sueldoBase ?? 0,
        sueldoFrecuencia: input.sueldoFrecuencia,
      });

      if (userResult.isFailure) {
        return Result.fail(userResult.getError());
      }

      const user = userResult.getValue();

      // Step 3: Save user to database
      const savedUserResult = await this.userRepository.create(user);
      if (savedUserResult.isFailure) {
        return Result.fail(savedUserResult.getError());
      }

      const savedUser = savedUserResult.getValue();

      // Step 4: Return DTO
      return Result.ok(this.toOutput(savedUser));
    } catch (error) {
      return Result.fail(UnexpectedError.from(error));
    }
  }

  private toOutput(user: User): UserOutputDTO {
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
