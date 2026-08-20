import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [SettingsModule],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
