import { Injectable, NestMiddleware } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { DomainsRepository } from '../domains/domains.repository';
import { TenantsRepository } from '../tenants/tenants.repository';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly domainsRepository: DomainsRepository,
    private readonly tenantsRepository: TenantsRepository,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async use(
    req: IncomingMessage,
    _res: ServerResponse,
    next: (error?: unknown) => void,
  ) {
    const hostname = this.extractHostname(req);
    const domain = hostname
      ? await this.domainsRepository.findByHostname(hostname)
      : undefined;

    if (!domain) {
      next();
      return;
    }

    const tenant = await this.tenantsRepository.findById(domain.tenantId);
    if (!tenant) {
      next();
      return;
    }

    this.tenantContextService.run(
      { tenantId: tenant.id, tenantStatus: tenant.status },
      next,
    );
  }

  private extractHostname(req: IncomingMessage): string | undefined {
    const headers = req.headers;
    const rawHost =
      this.headerValue(headers['x-tenant-host']) ??
      this.headerValue(headers['x-forwarded-host']) ??
      this.headerValue(headers['host']);

    if (!rawHost) {
      return undefined;
    }

    return rawHost.split(':')[0].trim().toLowerCase();
  }

  private headerValue(
    value: string | string[] | undefined,
  ): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }
}
