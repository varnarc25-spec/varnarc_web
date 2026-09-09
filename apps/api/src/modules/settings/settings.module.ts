import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { DatabaseBackupService } from './database-backup.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, DatabaseBackupService],
  exports: [SettingsService],
})
export class SettingsModule {}
