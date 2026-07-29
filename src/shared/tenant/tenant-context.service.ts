import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContextData {
  tenantId: string;
  tenantStatus: 'active' | 'suspended';
}

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantContextData>();

  run<T>(context: TenantContextData, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  get(): TenantContextData | undefined {
    return this.storage.getStore();
  }

  /** Safe to call anywhere behind TenantResolvedGuard, which guarantees context is set. */
  getOrThrow(): TenantContextData {
    const context = this.storage.getStore();
    if (!context) {
      throw new Error(
        'Tenant context not set — ensure TenantResolvedGuard runs before this call',
      );
    }
    return context;
  }

  getTenantIdOrThrow(): string {
    return this.getOrThrow().tenantId;
  }
}
