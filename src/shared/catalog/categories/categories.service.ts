import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  findAllForTenant(tenantId: string) {
    return this.categoriesRepository.findAllForTenant(tenantId);
  }

  findBySlugForTenant(tenantId: string, slug: string) {
    return this.categoriesRepository.findBySlugForTenant(tenantId, slug);
  }
}
