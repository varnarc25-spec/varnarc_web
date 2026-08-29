import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  AUTH_ERROR_CODES,
  PERMISSIONS,
  SUPER_ADMIN_EMAIL,
  isAdminRole,
  isSuperAdminEmail,
} from '@varnarc/auth';
import type { Repositories } from '@varnarc/database';
import type { CreateStaffUserInput } from '@varnarc/validation';
import { REPOS } from '../database/database.module';
import { UsersService } from './users.service';

export const ADMIN_JWT_ISSUER = 'varnarc-admin';
export const ADMIN_JWT_AUDIENCE = 'varnarc-admin';

const STAFF_ROLES = new Set(['super_admin', 'admin', 'editor']);

@Injectable()
export class AdminLocalAuthService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  getJwtSecret(): string {
    return (
      process.env.ADMIN_JWT_SECRET?.trim() ||
      process.env.AUTH0_SECRET?.trim() ||
      'varnarc-dev-admin-jwt'
    );
  }

  async login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    let user = await this.repos.users.findByEmail(normalized);

    if (!user?.passwordHash) {
      user = await this.maybeBootstrap(normalized, password, user?.id ?? null);
    }

    if (!user?.passwordHash) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid email or password.',
        },
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid email or password.',
        },
      });
    }

    if (user.status === 'DISABLED' || user.status === 'DELETED') {
      throw new ForbiddenException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.ACCOUNT_DISABLED,
          message: 'Account is disabled.',
        },
      });
    }

    const current = await this.users.findCurrentUserById(user.id);
    if (!this.canAccessAdmin(current.roles)) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.FORBIDDEN,
          message: 'This account cannot access the admin portal.',
        },
      });
    }

    await this.repos.users.setPasswordHash(user.id, user.passwordHash);
    const token = await this.signToken(current.id, current.email);
    return { token, user: current, expiresIn: 60 * 60 * 8 };
  }

  async createStaff(
    input: CreateStaffUserInput,
    actor: { id: string; roles: string[]; permissions: string[] },
  ) {
    const actorIsSuper = actor.roles.includes('super_admin');
    const actorIsAdmin = isAdminRole(actor.roles);
    if (!actorIsAdmin && !actor.permissions.includes(PERMISSIONS.USER_CREATE)) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.FORBIDDEN,
          message: 'Insufficient permissions.',
        },
      });
    }
    if (input.roleSlug === 'admin' && !actorIsSuper) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.FORBIDDEN,
          message: 'Only super admin can create admin users.',
        },
      });
    }

    const email = input.email.trim().toLowerCase();
    if (isSuperAdminEmail(email)) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'CONFLICT',
          message: `Super admin is reserved for ${SUPER_ADMIN_EMAIL}.`,
        },
      });
    }
    const existing = await this.repos.users.findByEmail(email);
    if (existing) {
      throw new ConflictException({
        success: false,
        error: { code: 'CONFLICT', message: 'A user with that email already exists.' },
      });
    }

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.repos.users.createStaffUser({
      id,
      email,
      displayName: input.displayName ?? null,
      passwordHash,
    });
    await this.repos.users.ensureRole(user.id, input.roleSlug);
    await this.repos.auditLogs.create({
      userId: actor.id,
      action: 'user.staff.create',
      entity: 'user',
      entityId: user.id,
      newValue: { email, roleSlug: input.roleSlug },
    });
    return this.users.findCurrentUserById(user.id);
  }

  private canAccessAdmin(roles: readonly string[]) {
    return isAdminRole(roles) || roles.some((role) => STAFF_ROLES.has(role));
  }

  private async signToken(userId: string, email: string) {
    return this.jwt.signAsync(
      { sub: userId, email, typ: 'admin' },
      {
        secret: this.getJwtSecret(),
        issuer: ADMIN_JWT_ISSUER,
        audience: ADMIN_JWT_AUDIENCE,
        expiresIn: '8h',
      },
    );
  }

  private async maybeBootstrap(email: string, password: string, existingId: string | null) {
    const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
    if (!bootstrapPassword) return null;
    if (email !== SUPER_ADMIN_EMAIL || password !== bootstrapPassword) return null;

    const hash = await bcrypt.hash(password, 12);
    if (existingId) {
      await this.repos.users.setPasswordHash(existingId, hash);
      await this.repos.users.ensureRole(existingId, 'super_admin');
      return this.repos.users.findById(existingId);
    }

    const staffCount = await this.repos.users.countWithPassword();
    if (staffCount > 0) return null;

    const id = randomUUID();
    const created = await this.repos.users.createStaffUser({
      id,
      email: SUPER_ADMIN_EMAIL,
      displayName: 'Super Admin',
      passwordHash: hash,
    });
    await this.repos.users.ensureRole(created.id, 'super_admin');
    return this.repos.users.findById(created.id);
  }
}
