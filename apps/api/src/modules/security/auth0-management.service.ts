import { Injectable, Logger } from '@nestjs/common';

type ManagementToken = {
  accessToken: string;
  expiresAt: number;
};

@Injectable()
export class Auth0ManagementService {
  private readonly logger = new Logger(Auth0ManagementService.name);
  private cachedToken: ManagementToken | null = null;

  isConfigured() {
    return Boolean(
      process.env.AUTH0_DOMAIN?.trim() &&
        process.env.AUTH0_MANAGEMENT_CLIENT_ID?.trim() &&
        process.env.AUTH0_MANAGEMENT_CLIENT_SECRET?.trim(),
    );
  }

  async revokeUserSessions(auth0UserId: string) {
    if (!this.isConfigured()) {
      return { revoked: false, reason: 'Auth0 Management API is not configured' };
    }

    const domain = process.env.AUTH0_DOMAIN!.trim();
    const token = await this.getManagementToken();
    const encodedId = encodeURIComponent(auth0UserId);

    const response = await fetch(`https://${domain}/api/v2/users/${encodedId}/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.warn(`Auth0 session revoke failed (${response.status}): ${body}`);
      return { revoked: false, reason: `Auth0 API error ${response.status}` };
    }

    return { revoked: true };
  }

  private async getManagementToken() {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 60_000) {
      return this.cachedToken.accessToken;
    }

    const domain = process.env.AUTH0_DOMAIN!.trim();
    const clientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID!.trim();
    const clientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET!.trim();

    const response = await fetch(`https://${domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${domain}/api/v2/`,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      throw new Error(`Auth0 token request failed (${response.status})`);
    }

    const payload = (await response.json()) as { access_token: string; expires_in: number };
    this.cachedToken = {
      accessToken: payload.access_token,
      expiresAt: Date.now() + payload.expires_in * 1000,
    };
    return this.cachedToken.accessToken;
  }
}
