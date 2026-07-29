import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  LOG_ACTIVITY_KEY,
  LogActivityMetadata,
} from '../decorators/log-activity.decorator';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import { ActivityLogService } from '../../shared/activity-log/activity-log.service';

const SENSITIVE_FIELDS = ['password', 'currentPassword', 'newPassword'];
const BODY_METHODS = ['POST', 'PATCH', 'PUT'];

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly activityLogService: ActivityLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.get<LogActivityMetadata | undefined>(
      LOG_ACTIVITY_KEY,
      context.getHandler(),
    );
    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      params?: Record<string, string>;
      method: string;
      body?: unknown;
    }>();
    const user = request.user;
    if (!user) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseBody) => {
        const entityId =
          request.params?.id ??
          (responseBody as { id?: string } | undefined)?.id;

        void this.activityLogService.record({
          tenantId: user.tenantId,
          userId: user.id,
          action: metadata.action,
          entity: metadata.entity,
          entityId,
          metadata: BODY_METHODS.includes(request.method)
            ? this.redact(request.body)
            : undefined,
        });
      }),
    );
  }

  private redact(body: unknown): unknown {
    if (typeof body !== 'object' || body === null) {
      return body;
    }
    const clone: Record<string, unknown> = {
      ...(body as Record<string, unknown>),
    };
    for (const field of SENSITIVE_FIELDS) {
      if (field in clone) {
        clone[field] = '[REDACTED]';
      }
    }
    return clone;
  }
}
