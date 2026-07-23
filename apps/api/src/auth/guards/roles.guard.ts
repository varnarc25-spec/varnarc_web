import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { hasAnyRole, AUTH_ERROR_CODES } from '@varnarc/auth';
import type { CurrentUser, RoleSlug } from '@varnarc/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleSlug[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: CurrentUser }>();
    const user = request.user;

    if (!user || !hasAnyRole(user.roles, required)) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.FORBIDDEN,
          message: 'Insufficient role.',
        },
      });
    }

    return true;
  }
}
