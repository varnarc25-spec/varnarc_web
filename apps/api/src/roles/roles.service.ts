import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type { CreateRoleInput, PaginationQuery, UpdateRoleInput } from '@varnarc/validation';
import { REPOS } from '../database/database.module';

@Injectable()
export class RolesService {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  async list(query: PaginationQuery) {
    const { total, rows } = await this.repos.roles.listOffset({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
    });

    return {
      data: rows.map((role) => this.mapRole(role)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async getById(id: string) {
    const role = await this.repos.roles.findById(id);
    if (!role) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Role not found.' },
      });
    }
    return this.mapRole(role);
  }

  async create(input: CreateRoleInput, actorId: string) {
    const result = await this.repos.roles.create({
      slug: input.slug,
      name: input.name,
      description: input.description,
      permissionIds: input.permissionIds,
    });

    if (!result.ok) {
      throw new BadRequestException({
        success: false,
        error: { code: 'INVALID_PERMISSIONS', message: 'One or more permissions are invalid.' },
      });
    }

    await this.repos.auditLogs.create({
      userId: actorId,
      action: 'role.create',
      entity: 'role',
      entityId: result.role.id,
      newValue: input as object,
    });

    return this.getById(result.role.id);
  }

  async update(id: string, input: UpdateRoleInput, actorId: string) {
    const existing = await this.repos.roles.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Role not found.' },
      });
    }

    const result = await this.repos.roles.update(id, {
      name: input.name,
      description: input.description,
      permissionIds: input.permissionIds,
    });

    if (!result.ok) {
      throw new BadRequestException({
        success: false,
        error: { code: 'INVALID_PERMISSIONS', message: 'One or more permissions are invalid.' },
      });
    }

    await this.repos.auditLogs.create({
      userId: actorId,
      action: 'role.update',
      entity: 'role',
      entityId: id,
      newValue: input as object,
    });

    return this.getById(id);
  }

  async remove(id: string, actorId: string) {
    const existing = await this.repos.roles.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Role not found.' },
      });
    }

    await this.repos.roles.softDelete(id, actorId);

    await this.repos.auditLogs.create({
      userId: actorId,
      action: 'role.delete',
      entity: 'role',
      entityId: id,
    });

    return { deleted: true };
  }

  private mapRole(role: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    _count: { users: number };
    permissions: Array<{
      permission: { id: string; slug: string; name: string; module: string };
    }>;
  }) {
    return {
      id: role.id,
      slug: role.slug,
      name: role.name,
      description: role.description,
      userCount: role._count.users,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        slug: rp.permission.slug,
        name: rp.permission.name,
        module: rp.permission.module,
      })),
      ...(role.createdAt ? { createdAt: role.createdAt } : {}),
      ...(role.updatedAt ? { updatedAt: role.updatedAt } : {}),
    };
  }
}
