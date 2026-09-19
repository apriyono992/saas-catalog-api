import {
  Controller,
  Get,
  MiddlewareConsumer,
  Module,
  NestModule,
  UseGuards,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { ConfigModule } from './../src/config/config.module';
import { DatabaseModule } from './../src/database/database.module';
import { DATABASE_CONNECTION } from './../src/database/database.providers';
import type { Database } from './../src/database/database.providers';
import { tenants, domains } from './../src/database/schema';
import { DomainsModule } from './../src/shared/domains/domains.module';
import { TenantsModule } from './../src/shared/tenants/tenants.module';
import { TenantModule } from './../src/shared/tenant/tenant.module';
import { TenantMiddleware } from './../src/shared/tenant/tenant.middleware';
import { TenantResolvedGuard } from './../src/shared/tenant/tenant-resolved.guard';
import { TenantContextService } from './../src/shared/tenant/tenant-context.service';

@Controller('store')
@UseGuards(TenantResolvedGuard)
class ProbeController {
  constructor(private readonly tenantContextService: TenantContextService) {}

  @Get()
  probeRoot() {
    return this.tenantContextService.get();
  }

  @Get('probe')
  probe() {
    return this.tenantContextService.get();
  }
}

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    DomainsModule,
    TenantsModule,
    TenantModule,
  ],
  controllers: [ProbeController],
})
class TestAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('store', 'store/*path');
  }
}

describe('Tenant resolution (e2e)', () => {
  let app: NestFastifyApplication;
  let db: Database;
  let tenantId: string;

  const hostname = 'e2e-tenant.test';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    db = moduleFixture.get(DATABASE_CONNECTION);
    const [tenant] = await db
      .insert(tenants)
      .values({ name: 'E2E Tenant' })
      .returning();
    tenantId = tenant.id;
    await db.insert(domains).values({ tenantId, hostname });
  });

  afterAll(async () => {
    await db.delete(tenants).where(eq(tenants.id, tenantId));
    await app.close();
  });

  it('resolves tenant context when the Host header matches a domain', async () => {
    const res = await request(app.getHttpServer())
      .get('/store/probe')
      .set('Host', hostname)
      .expect(200);

    expect(res.body).toMatchObject({ tenantId, tenantStatus: 'active' });
  });

  it('resolves tenant via X-Tenant-Host even when Host differs (in dev)', async () => {
    const res = await request(app.getHttpServer())
      .get('/store/probe')
      .set('Host', 'unrelated.test')
      .set('X-Tenant-Host', hostname)
      .expect(200);

    expect(res.body).toMatchObject({ tenantId });
  });

  it('returns 404 when the Host header matches no domain', async () => {
    await request(app.getHttpServer())
      .get('/store/probe')
      .set('Host', 'no-such-domain.test')
      .expect(404);
  });

  it('resolves tenant context at the bare prefix route too (regression: store/*path alone does not match /store)', async () => {
    const res = await request(app.getHttpServer())
      .get('/store')
      .set('Host', hostname)
      .expect(200);

    expect(res.body).toMatchObject({ tenantId, tenantStatus: 'active' });
  });
});
