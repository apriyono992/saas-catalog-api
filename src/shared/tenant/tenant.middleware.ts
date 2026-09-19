import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppConfig } from '../../config/configuration';
import { DomainsRepository } from '../domains/domains.repository';
import { TenantsRepository } from '../tenants/tenants.repository';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly isDev: boolean;

  constructor(
    private readonly domainsRepository: DomainsRepository,
    private readonly tenantsRepository: TenantsRepository,
    private readonly tenantContextService: TenantContextService,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.isDev =
      configService.get('app.nodeEnv', { infer: true }) !== 'production';
  }

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

    if (this.isDev) {
      const tenantHost = this.headerValue(headers['x-tenant-host']);
      if (tenantHost) {
        return tenantHost.split(':')[0].trim().toLowerCase();
      }
    }

    const origin = this.headerValue(headers['origin']);
    if (origin) {
      try {
        const originHost = new URL(origin).hostname.toLowerCase();
        if (originHost !== 'localhost' && originHost !== '127.0.0.1') {
          return originHost;
        }
      } catch {
        // ignore invalid origin
      }
    }

    const rawHost =
      this.headerValue(headers['x-forwarded-host']) ??
      this.headerValue(headers['host']);

    if (rawHost) {
      return rawHost.split(':')[0].trim().toLowerCase();
    }

    return undefined;
  }

  private headerValue(
    value: string | string[] | undefined,
  ): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }
}
