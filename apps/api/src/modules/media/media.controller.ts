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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { PERMISSIONS } from '@varnarc/auth';
import {
  bulkDeleteMediaSchema,
  createMediaAssetSchema,
  createMediaCollectionSchema,
  createMediaFolderSchema,
  mediaListQuerySchema,
  mediaSearchQuerySchema,
  updateMediaAssetSchema,
  updateMediaCollectionSchema,
  updateMediaFolderSchema,
  type CreateMediaAssetInput,
  type CreateMediaCollectionInput,
  type CreateMediaFolderInput,
  type MediaListQuery,
  type MediaSearchQuery,
  type UpdateMediaAssetInput,
  type UpdateMediaCollectionInput,
  type UpdateMediaFolderInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { MediaService } from './media.service';

const uploadStorage = memoryStorage();

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.MEDIA_VIEW)
  async list(@Query(new ZodValidationPipe(mediaListQuerySchema)) query: MediaListQuery) {
    return okCursor(await this.service.list(query));
  }

  @Get('search')
  @RequirePermissions(PERMISSIONS.MEDIA_VIEW)
  async search(@Query(new ZodValidationPipe(mediaSearchQuerySchema)) query: MediaSearchQuery) {
    return okCursor(await this.service.search(query));
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MEDIA_VIEW)
  async byId(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getById(id));
  }

  @Get(':id/usage')
  @RequirePermissions(PERMISSIONS.MEDIA_VIEW)
  async usage(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getUsage(id));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MEDIA_UPLOAD)
  async create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createMediaAssetSchema)) body: CreateMediaAssetInput,
  ) {
    return ok(await this.service.create(body, user.id));
  }

  @Post('upload')
  @RequirePermissions(PERMISSIONS.MEDIA_UPLOAD)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: uploadStorage,
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async upload(
    @CurrentUserDecorator() user: CurrentUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('folderId') folderId?: string,
    @Body('alt') alt?: string,
  ) {
    return ok(
      await this.service.uploadFile(file, user.id, {
        folderId: folderId || null,
        alt: alt || null,
      }),
    );
  }

  @Post('bulk-delete')
  @RequirePermissions(PERMISSIONS.MEDIA_DELETE)
  async bulkDelete(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(bulkDeleteMediaSchema)) body: { ids: string[] },
  ) {
    return ok(await this.service.bulkRemove(body.ids, user.id));
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MEDIA_EDIT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateMediaAssetSchema)) body: UpdateMediaAssetInput,
  ) {
    return ok(await this.service.update(id, body, user.id));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MEDIA_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.remove(id, user.id));
  }
}

@ApiTags('media-folders')
@Controller('media/folders')
export class MediaFoldersController {
  constructor(private readonly service: MediaService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.MEDIA_VIEW)
  async list(@Query('parentId') parentId?: string) {
    if (parentId === 'all') {
      return ok(await this.service.listAllFolders());
    }
    return okCursor(
      await this.service.listFolders({
        parentId: parentId === 'root' || parentId === '' ? null : parentId,
        limit: 100,
        direction: 'desc',
      }),
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MEDIA_VIEW)
  async byId(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getFolder(id));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MEDIA_EDIT)
  async create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createMediaFolderSchema)) body: CreateMediaFolderInput,
  ) {
    return ok(await this.service.createFolder(body, user.id));
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MEDIA_EDIT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateMediaFolderSchema)) body: UpdateMediaFolderInput,
  ) {
    return ok(await this.service.updateFolder(id, body, user.id));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MEDIA_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.removeFolder(id, user.id));
  }
}

@ApiTags('media-collections')
@Controller('media/collections')
export class MediaCollectionsController {
  constructor(private readonly service: MediaService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.MEDIA_VIEW)
  async list() {
    return okCursor(await this.service.listCollections({ limit: 100, direction: 'desc' }));
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MEDIA_VIEW)
  async byId(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getCollection(id));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MEDIA_EDIT)
  async create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createMediaCollectionSchema)) body: CreateMediaCollectionInput,
  ) {
    return ok(await this.service.createCollection(body, user.id));
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MEDIA_EDIT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateMediaCollectionSchema)) body: UpdateMediaCollectionInput,
  ) {
    return ok(await this.service.updateCollection(id, body, user.id));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MEDIA_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.removeCollection(id, user.id));
  }
}
