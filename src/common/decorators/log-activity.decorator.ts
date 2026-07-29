import { SetMetadata } from '@nestjs/common';

export const LOG_ACTIVITY_KEY = 'logActivity';

export interface LogActivityMetadata {
  action: string;
  entity?: string;
}

/** Marks a controller method for automatic recording via ActivityLogInterceptor. */
export const LogActivity = (action: string, entity?: string) =>
  SetMetadata(LOG_ACTIVITY_KEY, { action, entity });
