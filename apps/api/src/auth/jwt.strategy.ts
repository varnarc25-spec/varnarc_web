import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { decode as decodeJwt } from 'jsonwebtoken';
import type { Auth0TokenClaims } from '@varnarc/types';
import { AUTH_ERROR_CODES } from '@varnarc/auth';
import { Auth0ConfigService } from './auth0-config.service';
import { UsersService } from './users.service';
import { ADMIN_JWT_AUDIENCE, ADMIN_JWT_ISSUER } from './admin-local-auth.service';

type DualTokenClaims = Auth0TokenClaims & { typ?: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly auth0Config: Auth0ConfigService,
    private readonly usersService: UsersService,
  ) {
    const config = auth0Config.getConfig();
    const appSecret =
      process.env.ADMIN_JWT_SECRET?.trim() ||
      process.env.AUTH0_SECRET?.trim() ||
      'varnarc-dev-admin-jwt';
    const jwks = config.configured
      ? passportJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 10,
          jwksUri: `https://${config.domain}/.well-known/jwks.json`,
        })
      : null;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256', 'HS256'],
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        try {
          const decoded = decodeJwt(rawJwtToken, { complete: true });
          const alg = decoded?.header.alg;
          const payload = decoded?.payload;
          const iss = typeof payload === 'object' && payload ? payload.iss : undefined;
          if (alg === 'HS256' && iss === ADMIN_JWT_ISSUER) {
            done(null, appSecret);
            return;
          }
          if (jwks) {
            jwks(request, rawJwtToken, done);
            return;
          }
          done(null, process.env.AUTH0_SECRET || 'varnarc-dev-unconfigured-auth0');
        } catch (error) {
          done(error as Error);
        }
      },
    });
  }

  async validate(payload: DualTokenClaims) {
    if (!payload?.sub) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.TOKEN_INVALID,
          message: 'Authentication required.',
        },
      });
    }

    if (payload.iss === ADMIN_JWT_ISSUER || payload.typ === 'admin') {
      const audOk = Array.isArray(payload.aud)
        ? payload.aud.includes(ADMIN_JWT_AUDIENCE)
        : !payload.aud || payload.aud === ADMIN_JWT_AUDIENCE;
      if (!audOk) {
        throw new UnauthorizedException({
          success: false,
          error: {
            code: AUTH_ERROR_CODES.TOKEN_INVALID,
            message: 'Authentication required.',
          },
        });
      }
      return this.usersService.findCurrentUserById(payload.sub);
    }

    const config = this.auth0Config.getConfig();
    if (!config.configured) {
      return this.usersService.buildStubCurrentUser(payload);
    }

    const issuer = payload.iss?.replace(/\/$/, '') ?? '';
    const expectedIssuer = config.issuer.replace(/\/$/, '');
    if (issuer && issuer !== expectedIssuer) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.TOKEN_INVALID,
          message: 'Authentication required.',
        },
      });
    }
    const audience = payload.aud;
    const audienceOk = Array.isArray(audience)
      ? audience.includes(config.audience)
      : !config.audience || audience === config.audience;
    if (!audienceOk) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.TOKEN_INVALID,
          message: 'Authentication required.',
        },
      });
    }

    return this.usersService.ensureFromAuth0Claims(payload);
  }
}
