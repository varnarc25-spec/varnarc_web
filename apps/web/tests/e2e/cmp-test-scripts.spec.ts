import { expect, test } from '@playwright/test';

const POLL_TIMEOUT_MS = 30_000;

test.describe('CMP test scripts', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('loads third-party scripts after accept all', async ({ page }) => {
    test.setTimeout(120_000);

    const trackerRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (
        url.includes('googletagmanager.com') ||
        url.includes('clarity.ms') ||
        url.includes('facebook.net')
      ) {
        trackerRequests.push(url);
      }
    });

    await page.goto('/');

    await expect
      .poll(async () => page.evaluate(() => Boolean(document.getElementById('cmp-sdk'))), {
        timeout: POLL_TIMEOUT_MS,
      })
      .toBe(true);

    await expect
      .poll(async () => page.evaluate(() => Boolean(document.getElementById('cmp-test-scripts'))), {
        timeout: POLL_TIMEOUT_MS,
      })
      .toBe(true);

    await expect
      .poll(async () => page.evaluate(() => Boolean(window.__CMP__?.acceptAll)), {
        timeout: POLL_TIMEOUT_MS,
      })
      .toBe(true);

    const acceptAll = page.getByRole('button', { name: 'Accept all' });
    if (await acceptAll.isVisible().catch(() => false)) {
      await acceptAll.click();
    } else {
      await page.evaluate(() => window.__CMP__?.acceptAll?.());
    }

    await expect
      .poll(async () => page.evaluate(() => window.__CMP__?.getConsent?.()?.analytics === true), {
        timeout: POLL_TIMEOUT_MS,
      })
      .toBe(true);

    await expect
      .poll(async () => page.evaluate(() => Boolean(document.getElementById('cmp-test-gtag'))), {
        timeout: POLL_TIMEOUT_MS,
      })
      .toBe(true);

    await expect
      .poll(
        async () => page.evaluate(() => Boolean(document.getElementById('cmp-test-meta-pixel'))),
        { timeout: POLL_TIMEOUT_MS },
      )
      .toBe(true);

    await expect
      .poll(async () => trackerRequests.some((url) => url.includes('googletagmanager.com')), {
        timeout: POLL_TIMEOUT_MS,
      })
      .toBe(true);

    await expect
      .poll(async () => trackerRequests.some((url) => url.includes('clarity.ms')), {
        timeout: POLL_TIMEOUT_MS,
      })
      .toBe(true);

    await expect
      .poll(async () => trackerRequests.some((url) => url.includes('facebook.net')), {
        timeout: POLL_TIMEOUT_MS,
      })
      .toBe(true);
  });
});
