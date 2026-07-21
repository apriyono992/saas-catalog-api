import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from './current-user.decorator';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    return request.user?.tenantId ?? null;
  },
);
