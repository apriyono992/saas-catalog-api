import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../../shared/auth/role.type';

export interface AuthenticatedUser {
  id: string;
  tenantId: string | null;
  role: Role;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
