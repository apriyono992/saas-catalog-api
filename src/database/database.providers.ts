import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { AppConfig } from '../config/configuration';
import * as schema from './schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';
export const DATABASE_POOL = 'DATABASE_POOL';

export type Database = NodePgDatabase<typeof schema>;

export const databaseProviders: Provider[] = [
  {
    provide: DATABASE_POOL,
    inject: [ConfigService],
    useFactory: (configService: ConfigService<AppConfig, true>): Pool =>
      new Pool({
        connectionString: configService.get('database.url', { infer: true }),
      }),
  },
  {
    provide: DATABASE_CONNECTION,
    inject: [DATABASE_POOL],
    useFactory: (pool: Pool): Database => drizzle(pool, { schema }),
  },
];
