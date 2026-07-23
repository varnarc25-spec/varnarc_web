import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { hasPermission, AUTH_ERROR_CODES, type Permission } from '@varnarc/auth';
import type { CurrentUser } from '@varnarc/types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: CurrentUser }>();
    const user = request.user;

    if (!user || !hasPermission(user.permissions, required)) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.FORBIDDEN,
          message: 'Insufficient permissions.',
        },
      });
    }

    return true;
  }
}
