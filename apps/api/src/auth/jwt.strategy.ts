import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import type { Auth0TokenClaims } from '@varnarc/types';
import { AUTH_ERROR_CODES } from '@varnarc/auth';
import { Auth0ConfigService } from './auth0-config.service';
import { UsersService } from './users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly auth0Config: Auth0ConfigService,
    private readonly usersService: UsersService,
  ) {
    const config = auth0Config.getConfig();

    super(
      config.configured
        ? {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            audience: config.audience,
            issuer: config.issuer,
            algorithms: ['RS256'],
            secretOrKeyProvider: passportJwtSecret({
              cache: true,
              rateLimit: true,
              jwksRequestsPerMinute: 10,
              jwksUri: `https://${config.domain}/.well-known/jwks.json`,
            }),
          }
        : {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.AUTH0_SECRET || 'varnarc-dev-unconfigured-auth0',
            algorithms: ['HS256'],
            ignoreExpiration: true,
          },
    );
  }

  async validate(payload: Auth0TokenClaims) {
    if (!payload?.sub) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.TOKEN_INVALID,
          message: 'Authentication required.',
        },
      });
    }

    const config = this.auth0Config.getConfig();
    if (!config.configured) {
      return this.usersService.buildStubCurrentUser(payload);
    }

    return this.usersService.ensureFromAuth0Claims(payload);
  }
}
