import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantResolvedGuard implements CanActivate {
  constructor(private readonly tenantContextService: TenantContextService) {}

  canActivate(): boolean {
    if (!this.tenantContextService.get()) {
      throw new NotFoundException('Tenant not found');
    }
    return true;
  }
}
