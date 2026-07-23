import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { Auth0ConfigService } from './auth0-config.service';
import { CurrentUserDecorator } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { CurrentUser } from '@varnarc/types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auth0Config: Auth0ConfigService,
  ) {}

  @Public()
  @Get('status')
  status() {
    const config = this.auth0Config.getConfig();
    return {
      success: true,
      data: {
        provider: 'auth0',
        configured: config.configured,
        domain: config.configured ? config.domain : null,
        audience: config.configured ? config.audience : null,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUserDecorator() user: CurrentUser) {
    return { success: true, data: this.authService.me(user) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('sync')
  async sync(
    @CurrentUserDecorator() user: CurrentUser,
    @Body()
    body: {
      email?: string;
      email_verified?: boolean;
      name?: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
      sub?: string;
    },
    @Req() req: Request,
  ) {
    const claims = {
      sub: body.sub ?? user.auth0UserId,
      email: body.email ?? user.email,
      email_verified: body.email_verified ?? user.emailVerified,
      name: body.name ?? user.displayName ?? undefined,
      given_name: body.given_name ?? user.firstName ?? undefined,
      family_name: body.family_name ?? user.lastName ?? undefined,
      picture: body.picture ?? user.avatarUrl ?? undefined,
    };

    const data = await this.authService.sync(claims, {
      ipAddress: req.ip,
      device: req.headers['sec-ch-ua-platform']?.toString(),
      browser: req.headers['user-agent']?.toString(),
    });

    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUserDecorator() user: CurrentUser, @Req() req: Request) {
    const data = await this.authService.logout(user, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']?.toString(),
    });
    return { success: true, data };
  }
}
