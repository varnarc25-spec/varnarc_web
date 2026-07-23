import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserProfileService } from './user-profile.service';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../modules/media/media.module';

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [UsersController],
  providers: [UserProfileService],
  exports: [UserProfileService],
})
export class UsersModule {}
