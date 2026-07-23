import { Injectable, Logger } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

const API_BASE = 'https://adsense.googleapis.com/v2';

export type AdsenseApiConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accountId?: string;
  currency: string;
};

export type AdsenseReportTotals = {
  revenue: number;
  impressions: number;
  currency: string;
};

export function getAdsenseApiConfig(): AdsenseApiConfig | null {
  const clientId = process.env.ADSENSE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.ADSENSE_OAUTH_CLIENT_SECRET?.trim();
  const refreshToken = process.env.ADSENSE_OAUTH_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) return null;

  return {
    clientId,
    clientSecret,
    refreshToken,
    accountId: process.env.ADSENSE_ACCOUNT_ID?.trim(),
    currency: process.env.ADSENSE_CURRENCY?.trim() || 'INR',
  };
}

export function parseAdsenseReportTotals(
  body: { totals?: { cells?: Array<{ value?: string }> } },
  currency: string,
): AdsenseReportTotals {
  const cells = body.totals?.cells ?? [];
  const revenue = Number(cells[0]?.value ?? 0);
  const impressions = Number.parseInt(cells[1]?.value ?? '0', 10) || 0;
  return { revenue, impressions, currency };
}

@Injectable()
export class AdsenseApiService {
  private readonly logger = new Logger(AdsenseApiService.name);

  getStatus() {
    const config = getAdsenseApiConfig();
    return {
      configured: Boolean(config),
      syncEnabled: process.env.ADSENSE_SYNC_ENABLED === 'true',
      accountId: config?.accountId ?? null,
      currency: config?.currency ?? 'INR',
    };
  }

  async fetchLast30DaysReport(): Promise<AdsenseReportTotals> {
    const config = getAdsenseApiConfig();
    if (!config) {
      throw new Error(
        'AdSense API is not configured. Set ADSENSE_OAUTH_CLIENT_ID, ADSENSE_OAUTH_CLIENT_SECRET, and ADSENSE_OAUTH_REFRESH_TOKEN.',
      );
    }

    const accessToken = await this.getAccessToken(config);
    const account = await this.resolveAccount(accessToken, config.accountId);
    const url = new URL(`${API_BASE}/${account}/reports:generate`);
    url.searchParams.set('dateRange', 'LAST_30_DAYS');
    url.searchParams.append('metrics', 'ESTIMATED_EARNINGS');
    url.searchParams.append('metrics', 'IMPRESSIONS');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`AdSense report failed (${res.status}): ${text.slice(0, 300)}`);
    }

    const json = (await res.json()) as { totals?: { cells?: Array<{ value?: string }> } };
    const totals = parseAdsenseReportTotals(json, config.currency);
    this.logger.log(
      `AdSense API report: ${totals.revenue} ${totals.currency}, ${totals.impressions} impressions`,
    );
    return totals;
  }

  private async getAccessToken(config: AdsenseApiConfig) {
    const auth = new OAuth2Client(config.clientId, config.clientSecret);
    auth.setCredentials({ refresh_token: config.refreshToken });
    const result = await auth.getAccessToken();
    const token = result.token;
    if (!token) {
      throw new Error('Failed to obtain Google AdSense access token');
    }
    return token;
  }

  private async resolveAccount(accessToken: string, configuredAccount?: string) {
    if (configuredAccount) {
      return configuredAccount.startsWith('accounts/')
        ? configuredAccount
        : `accounts/${configuredAccount}`;
    }

    const res = await fetch(`${API_BASE}/accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`AdSense accounts list failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as { accounts?: Array<{ name?: string }> };
    const account = json.accounts?.[0]?.name;
    if (!account) {
      throw new Error('No AdSense accounts found for the configured OAuth credentials.');
    }
    return account;
  }
}
