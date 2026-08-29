import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { JwtStrategy } from './jwt.strategy';
import { Auth0ConfigService } from './auth0-config.service';
import { AdminLocalAuthService } from './admin-local-auth.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, UsersService, JwtStrategy, Auth0ConfigService, AdminLocalAuthService],
  exports: [AuthService, UsersService, Auth0ConfigService, AdminLocalAuthService],
})
export class AuthModule {}
