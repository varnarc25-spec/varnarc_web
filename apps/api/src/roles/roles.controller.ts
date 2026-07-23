import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUserDecorator } from '../auth/decorators/current-user.decorator';
import { PERMISSIONS } from '@varnarc/auth';
import {
  createRoleSchema,
  paginationQuerySchema,
  updateRoleSchema,
} from '@varnarc/validation';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import type { CurrentUser } from '@varnarc/types';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ROLE_VIEW)
  async list(@Query(new ZodValidationPipe(paginationQuerySchema)) query: unknown) {
    const result = await this.rolesService.list(paginationQuerySchema.parse(query));
    return { success: true, ...result };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ROLE_VIEW)
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.rolesService.getById(id) };
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ROLE_MANAGE)
  async create(
    @CurrentUserDecorator() actor: CurrentUser,
    @Body(new ZodValidationPipe(createRoleSchema)) body: unknown,
  ) {
    return {
      success: true,
      data: await this.rolesService.create(createRoleSchema.parse(body), actor.id),
    };
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.ROLE_MANAGE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() actor: CurrentUser,
    @Body(new ZodValidationPipe(updateRoleSchema)) body: unknown,
  ) {
    return {
      success: true,
      data: await this.rolesService.update(id, updateRoleSchema.parse(body), actor.id),
    };
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ROLE_MANAGE)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() actor: CurrentUser,
  ) {
    return {
      success: true,
      data: await this.rolesService.remove(id, actor.id),
    };
  }
}
