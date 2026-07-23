import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { JwtStrategy } from './jwt.strategy';
import { Auth0ConfigService } from './auth0-config.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [AuthService, UsersService, JwtStrategy, Auth0ConfigService],
  exports: [AuthService, UsersService, Auth0ConfigService],
})
export class AuthModule {}
