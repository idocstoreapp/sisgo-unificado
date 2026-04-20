/**
 * CreateBranchUseCase - creates a new branch for a company
 */

import { Result, ValidationError, RepositoryError, UnexpectedError } from "@/shared/kernel";
import { Branch } from "@/domain/entities/Branch";
import type { IBranchRepository } from "@/domain/repositories/IBranchRepository";
import type { CreateBranchDTO, BranchOutputDTO } from "@/application/dtos/CreateCompanyDTO";

type CreateBranchError = ValidationError | RepositoryError | UnexpectedError;

export class CreateBranchUseCase {
  constructor(private readonly branchRepository: IBranchRepository) {}

  async execute(input: CreateBranchDTO): Promise<Result<BranchOutputDTO, CreateBranchError>> {
    try {
      // Step 1: Create branch entity with validation
      const branchResult = Branch.create({
        id: crypto.randomUUID(),
        companyId: input.companyId,
        name: input.name,
        code: input.code,
        address: input.address,
        phone: input.phone,
        email: input.email,
      });

      if (branchResult.isFailure) {
        return Result.fail(branchResult.getError());
      }

      const branch = branchResult.getValue();

      // Step 2: Save branch to database
      const savedBranchResult = await this.branchRepository.create(branch);
      if (savedBranchResult.isFailure) {
        return Result.fail(savedBranchResult.getError());
      }

      const savedBranch = savedBranchResult.getValue();

      // Step 3: Return DTO
      return Result.ok(this.toOutput(savedBranch));
    } catch (error) {
      return Result.fail(UnexpectedError.from(error));
    }
  }

  private toOutput(branch: Branch): BranchOutputDTO {
    return {
      id: branch.id,
      companyId: branch.companyId,
      name: branch.name,
      code: branch.code ?? null,
      address: branch.address ?? null,
      phone: branch.phone ?? null,
      email: branch.email ?? null,
      logoUrl: branch.logoUrl ?? null,
      isActive: branch.isActive,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt ?? null,
    };
  }
}
