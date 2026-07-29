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
}
