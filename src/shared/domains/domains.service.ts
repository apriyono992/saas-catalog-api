import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DomainsRepository } from './domains.repository';

const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class DomainsService {
  constructor(private readonly domainsRepository: DomainsRepository) {}

  listForTenant(tenantId: string | null) {
    this.assertTenantScoped(tenantId);
    return this.domainsRepository.findAllForTenant(tenantId);
  }

  async create(tenantId: string | null, hostname: string) {
    this.assertTenantScoped(tenantId);
    const normalizedHostname = hostname.trim().toLowerCase();

    try {
      return await this.domainsRepository.create(tenantId, normalizedHostname);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Hostname is already in use');
      }
      throw error;
    }
  }

  async remove(tenantId: string | null, id: string) {
    this.assertTenantScoped(tenantId);
    const deleted = await this.domainsRepository.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundException('Domain not found');
    }
  }

  async verify(tenantId: string | null, id: string) {
    this.assertTenantScoped(tenantId);
    const verified = await this.domainsRepository.verify(id, tenantId);
    if (!verified) {
      throw new NotFoundException('Domain not found');
    }
    return verified;
  }

  private assertTenantScoped(
    tenantId: string | null,
  ): asserts tenantId is string {
    if (!tenantId) {
      throw new ForbiddenException(
        'This action requires a tenant-scoped account',
      );
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return this.pgErrorCode(error) === POSTGRES_UNIQUE_VIOLATION;
  }

  /** drizzle-orm wraps driver errors, so the pg error code lives on `cause`. */
  private pgErrorCode(error: unknown): unknown {
    if (typeof error !== 'object' || error === null) {
      return undefined;
    }
    if ('code' in error) {
      return error.code;
    }
    if ('cause' in error) {
      return this.pgErrorCode(error.cause);
    }
    return undefined;
  }
}
