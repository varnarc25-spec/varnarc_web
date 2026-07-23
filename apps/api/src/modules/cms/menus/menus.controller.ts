import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import {
  createMenuItemSchema,
  createMenuSchema,
  cursorPaginationQuerySchema,
  reorderMenuItemsSchema,
  updateMenuItemSchema,
  updateMenuSchema,
  type CreateMenuInput,
  type CreateMenuItemInput,
  type CursorPaginationQuery,
  type ReorderMenuItemsInput,
  type UpdateMenuInput,
  type UpdateMenuItemInput,
} from '@varnarc/validation';
import { z } from 'zod';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { Public } from '../../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/zod-validation.pipe';
import { ok, okCursor } from '../../../common/utils/response';
import { MenusService } from './menus.service';

const menuListSchema = cursorPaginationQuerySchema.extend({
  location: z.string().max(60).optional(),
});

@ApiTags('menus')
@Controller('menus')
export class MenusController {
  constructor(private readonly service: MenusService) {}

  @Public()
  @Get('location/:location')
  async byLocation(@Param('location') location: string) {
    return ok(await this.service.getByLocation(location));
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  async list(
    @Query(new ZodValidationPipe(menuListSchema))
    query: CursorPaginationQuery & { location?: string },
  ) {
    return okCursor(await this.service.list(query));
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  async byId(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getById(id));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  async create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createMenuSchema)) body: CreateMenuInput,
  ) {
    return ok(await this.service.create(body, user.id));
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateMenuSchema)) body: UpdateMenuInput,
  ) {
    return ok(await this.service.update(id, body, user.id));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.remove(id, user.id));
  }

  @Post(':id/items')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  async addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createMenuItemSchema)) body: CreateMenuItemInput,
  ) {
    return ok(await this.service.addItem(id, body, user.id));
  }

  @Put(':id/items/:itemId')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateMenuItemSchema)) body: UpdateMenuItemInput,
  ) {
    return ok(await this.service.updateItem(id, itemId, body, user.id));
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  async removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.removeItem(id, itemId, user.id));
  }

  @Put(':id/reorder')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  async reorder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(reorderMenuItemsSchema)) body: ReorderMenuItemsInput,
  ) {
    return ok(await this.service.reorder(id, body));
  }
}
