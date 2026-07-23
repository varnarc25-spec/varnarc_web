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
  calculatorListQuerySchema,
  cloneCalculatorSchema,
  createCalculatorCategorySchema,
  createCalculatorSchema,
  cursorPaginationQuerySchema,
  relatedArticlesQuerySchema,
  runCalculatorSchema,
  saveCalculationSchema,
  updateCalculatorCategorySchema,
  updateCalculatorSchema,
  type CalculatorListQuery,
  type CloneCalculatorInput,
  type CreateCalculatorCategoryInput,
  type CreateCalculatorInput,
  type CursorPaginationQuery,
  type RelatedArticlesQuery,
  type RunCalculatorInput,
  type SaveCalculationInput,
  type UpdateCalculatorCategoryInput,
  type UpdateCalculatorInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { CalculatorService } from './calculator.service';

@ApiTags('calculators')
@Controller('calculators')
export class CalculatorController {
  constructor(private readonly service: CalculatorService) {}

  @Public()
  @Get('categories')
  async categories() {
    return ok(await this.service.listCategories());
  }

  @Post('categories')
  @RequirePermissions(PERMISSIONS.CALCULATOR_EDIT)
  async createCategory(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createCalculatorCategorySchema)) body: CreateCalculatorCategoryInput,
  ) {
    return ok(await this.service.createCategory(body, user.id));
  }

  @Put('categories/:id')
  @RequirePermissions(PERMISSIONS.CALCULATOR_EDIT)
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateCalculatorCategorySchema)) body: UpdateCalculatorCategoryInput,
  ) {
    return ok(await this.service.updateCategory(id, body, user.id));
  }

  @Delete('categories/:id')
  @RequirePermissions(PERMISSIONS.CALCULATOR_DELETE)
  async deleteCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.removeCategory(id, user.id));
  }

  @Get('analytics')
  @RequirePermissions(PERMISSIONS.CALCULATOR_VIEW)
  async analytics() {
    return ok(await this.service.analytics());
  }

  @Get('results')
  async results(
    @CurrentUserDecorator() user: CurrentUser,
    @Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery,
  ) {
    return okCursor(await this.service.listSaved(user.id, query));
  }

  @Post('results')
  async saveResult(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(saveCalculationSchema)) body: SaveCalculationInput,
  ) {
    return ok(await this.service.saveResult(body, user.id));
  }

  @Delete('results/:id')
  async deleteResult(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.deleteSaved(id, user.id));
  }

  /** @deprecated Prefer GET /calculators/results */
  @Get('saved/me')
  async mySaved(
    @CurrentUserDecorator() user: CurrentUser,
    @Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery,
  ) {
    return okCursor(await this.service.listSaved(user.id, query));
  }

  /** @deprecated Prefer POST /calculators/results */
  @Post('saved')
  async save(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(saveCalculationSchema)) body: SaveCalculationInput,
  ) {
    return ok(await this.service.saveResult(body, user.id));
  }

  @Public()
  @Get()
  async list(@Query(new ZodValidationPipe(calculatorListQuerySchema)) query: CalculatorListQuery) {
    return okCursor(await this.service.list({ ...query, status: query.status ?? 'PUBLISHED' }));
  }

  @Get('admin/all')
  @RequirePermissions(PERMISSIONS.CALCULATOR_VIEW)
  async adminList(@Query(new ZodValidationPipe(calculatorListQuerySchema)) query: CalculatorListQuery) {
    return okCursor(await this.service.list(query));
  }

  @Public()
  @Get('slug/:slug')
  async bySlug(@Param('slug') slug: string) {
    return ok(await this.service.getBySlug(slug, true));
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CALCULATOR_VIEW)
  async byId(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getById(id));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CALCULATOR_CREATE)
  async create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createCalculatorSchema)) body: CreateCalculatorInput,
  ) {
    return ok(await this.service.create(body, user.id));
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.CALCULATOR_EDIT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateCalculatorSchema)) body: UpdateCalculatorInput,
  ) {
    return ok(await this.service.update(id, body, user.id));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.CALCULATOR_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.remove(id, user.id));
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.CALCULATOR_PUBLISH)
  async publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.publish(id, user.id));
  }

  @Post(':id/clone')
  @RequirePermissions(PERMISSIONS.CALCULATOR_CREATE)
  async clone(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(cloneCalculatorSchema)) body: CloneCalculatorInput,
  ) {
    return ok(await this.service.clone(id, body, user.id));
  }

  @Get(':id/related')
  @Public()
  async related(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.related(id));
  }

  @Get(':id/related-articles')
  @Public()
  async relatedArticles(
    @Param('id', ParseUUIDPipe) id: string,
    @Query(new ZodValidationPipe(relatedArticlesQuerySchema)) query: RelatedArticlesQuery,
  ) {
    return ok(await this.service.relatedArticles(id, query.topic));
  }

  @Get(':id/versions')
  @RequirePermissions(PERMISSIONS.CALCULATOR_VIEW)
  async versions(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.versions(id));
  }

  @Post(':id/preview')
  @RequirePermissions(PERMISSIONS.CALCULATOR_EDIT)
  async preview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(runCalculatorSchema)) body: RunCalculatorInput,
  ) {
    return ok(await this.service.preview(id, body));
  }

  @Public()
  @Post(':id/calculate')
  async calculate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(runCalculatorSchema)) body: RunCalculatorInput,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(await this.service.calculate(id, body, user?.id ?? null));
  }
}
