import { Module } from '@nestjs/common';
import { MediaController, MediaCollectionsController, MediaFoldersController } from './media.controller';
import { MediaService } from './media.service';
import { GcsStorageService } from './gcs-storage.service';

@Module({
  controllers: [MediaController, MediaFoldersController, MediaCollectionsController],
  providers: [MediaService, GcsStorageService],
  exports: [MediaService, GcsStorageService],
})
export class MediaModule {}
