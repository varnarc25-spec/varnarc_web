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
import type { CurrentUser } from '@varnarc/types';
import {
  createHomepageLayoutSchema,
  cursorPaginationQuerySchema,
  updateHomepageLayoutSchema,
  type CreateHomepageLayoutInput,
  type CursorPaginationQuery,
  type UpdateHomepageLayoutInput,
} from '@varnarc/validation';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { HomepageService } from './homepage.service';

@ApiTags('homepage')
@Controller('homepage')
export class HomepageController {
  constructor(private readonly service: HomepageService) {}

  @Public()
  @Get('default')
  async defaultLayout() {
    return ok(await this.service.getDefault());
  }

  @Public()
  @Get('slug/:slug')
  async bySlug(@Param('slug') slug: string) {
    return ok(await this.service.getBySlug(slug));
  }

  @Get('widgets')
  @RequirePermissions(PERMISSIONS.HOMEPAGE_MANAGE)
  async widgets() {
    return ok(await this.service.listWidgets());
  }

  @Get()
  @RequirePermissions(PERMISSIONS.HOMEPAGE_MANAGE)
  async list(@Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery) {
    return okCursor(await this.service.list(query));
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.HOMEPAGE_MANAGE)
  async byId(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getById(id));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.HOMEPAGE_MANAGE)
  async create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createHomepageLayoutSchema)) body: CreateHomepageLayoutInput,
  ) {
    return ok(await this.service.create(body, user.id));
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.HOMEPAGE_MANAGE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateHomepageLayoutSchema)) body: UpdateHomepageLayoutInput,
  ) {
    return ok(await this.service.update(id, body, user.id));
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.HOMEPAGE_MANAGE)
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.publish(id, user.id));
  }

  @Post(':id/set-default')
  @RequirePermissions(PERMISSIONS.HOMEPAGE_MANAGE)
  async setDefault(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.setDefault(id, user.id));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.HOMEPAGE_MANAGE)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.remove(id, user.id));
  }
}
