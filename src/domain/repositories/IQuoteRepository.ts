/**
 * Quote repository interface
 */

import { Result } from "@/shared/kernel";
import type { Quote } from "@/entities/Quote";
import type { QuoteStatus } from "@/entities/Quote";
import type { RepositoryError, NotFoundError } from "@/shared/kernel/errors";

export interface QuoteFilters {
  status?: QuoteStatus;
  customerId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface IQuoteRepository {
  /** Find quote by ID */
  findById(id: string): Promise<Result<Quote, NotFoundError | RepositoryError>>;

  /** Find quote by quote number */
  findByQuoteNumber(quoteNumber: string, companyId: string): Promise<Result<Quote | null, RepositoryError>>;

  /** Find quotes for a company with optional filters */
  findByCompany(companyId: string, filters?: QuoteFilters): Promise<Result<Quote[], RepositoryError>>;

  /** Find quotes for a customer */
  findByCustomer(customerId: string): Promise<Result<Quote[], RepositoryError>>;

  /** Count quotes by status for a company */
  countByStatus(companyId: string, status: QuoteStatus): Promise<Result<number, RepositoryError>>;

  /** Create a new quote */
  create(quote: Quote): Promise<Result<Quote, RepositoryError>>;

  /** Update an existing quote */
  update(quote: Quote): Promise<Result<Quote, RepositoryError>>;

  /** Delete a quote */
  delete(id: string): Promise<Result<void, RepositoryError>>;

  /** Generate next quote number for a company */
  getNextQuoteNumber(companyId: string): Promise<Result<string, RepositoryError>>;
}
