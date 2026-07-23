import { Injectable } from '@nestjs/common';
import type { Auth0TokenClaims, CurrentUser } from '@varnarc/types';
import { UsersService } from './users.service';
import { prisma } from '@varnarc/database';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  me(user: CurrentUser): CurrentUser {
    return user;
  }

  sync(
    claims: Auth0TokenClaims,
    meta?: {
      ipAddress?: string;
      device?: string;
      browser?: string;
      operatingSystem?: string;
      country?: string;
    },
  ) {
    return this.usersService.syncFromAuth0(claims, meta);
  }

  async logout(
    user: CurrentUser,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'auth.logout',
        entity: 'user',
        entityId: user.id,
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
      },
    });

    return { loggedOut: true };
  }
}
