import { Role } from '../role.type';

export interface JwtPayload {
  sub: string;
  tenantId: string | null;
  role: Role;
}
