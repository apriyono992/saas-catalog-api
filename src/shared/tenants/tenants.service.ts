import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantsRepository } from './tenants.repository';

@Injectable()
export class TenantsService {
  constructor(private readonly tenantsRepository: TenantsRepository) {}

  create(name: string) {
    return this.tenantsRepository.create(name);
  }

  findAll() {
    return this.tenantsRepository.findAll();
  }

  async findByIdOrThrow(id: string) {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async updateName(id: string, name: string) {
    await this.findByIdOrThrow(id);
    return this.tenantsRepository.updateName(id, name);
  }

  async update(
    id: string,
    data: { name?: string; status?: 'active' | 'suspended' },
  ) {
    await this.findByIdOrThrow(id);
    if (data.name !== undefined) {
      await this.tenantsRepository.updateName(id, data.name);
    }
    if (data.status !== undefined) {
      await this.tenantsRepository.updateStatus(id, data.status);
    }
    return this.findByIdOrThrow(id);
  }

  async suspend(id: string) {
    await this.findByIdOrThrow(id);
    return this.tenantsRepository.updateStatus(id, 'suspended');
  }

  async activate(id: string) {
    await this.findByIdOrThrow(id);
    return this.tenantsRepository.updateStatus(id, 'active');
  }
}
