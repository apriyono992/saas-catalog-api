import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';
import {
  DATABASE_CONNECTION,
  DATABASE_POOL,
  databaseProviders,
} from './database.providers';

@Global()
@Module({
  providers: [...databaseProviders],
  exports: [DATABASE_CONNECTION, DATABASE_POOL],
})
export class DatabaseModule implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onModuleInit() {
    try {
      await this.pool.query('SELECT 1');
    } catch (error) {
      const cause = error instanceof Error ? error.message : String(error);
      this.logger.error(`Database connection failed: ${cause}`);
      throw new Error(
        `Unable to connect to the database. Check that DATABASE_URL is correct and the database is reachable. Cause: ${cause}`,
      );
    }
  }

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
