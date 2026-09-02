import { Module } from '@nestjs/common';
import {
  MediaController,
  MediaCollectionsController,
  MediaFoldersController,
} from './media.controller';
import { MediaService } from './media.service';
import { GcsStorageService } from './gcs-storage.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [MediaController, MediaFoldersController, MediaCollectionsController],
  providers: [MediaService, GcsStorageService],
  exports: [MediaService, GcsStorageService],
})
export class MediaModule {}
