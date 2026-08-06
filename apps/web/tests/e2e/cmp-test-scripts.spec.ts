import { expect, test } from '@playwright/test';

test.describe('CMP test scripts', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('loads third-party scripts after accept all', async ({ page }) => {
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
        timeout: 20_000,
      })
      .toBe(true);

    await expect
      .poll(async () => page.evaluate(() => Boolean(document.getElementById('cmp-test-scripts'))), {
        timeout: 20_000,
      })
      .toBe(true);

    await expect
      .poll(async () => page.evaluate(() => Boolean(window.__CMP__?.acceptAll)), {
        timeout: 20_000,
      })
      .toBe(true);

    const acceptAll = page.getByRole('button', { name: 'Accept all' });
    if (await acceptAll.isVisible().catch(() => false)) {
      await acceptAll.click();
    } else {
      await page.evaluate(() => window.__CMP__?.acceptAll?.());
    }

    await expect
      .poll(async () => page.evaluate(() => window.__CMP__?.getConsent?.()?.analytics === true))
      .toBe(true);

    await expect
      .poll(async () => page.evaluate(() => Boolean(document.getElementById('cmp-test-gtag'))))
      .toBe(true);

    await expect
      .poll(async () =>
        page.evaluate(() => Boolean(document.getElementById('cmp-test-meta-pixel'))),
      )
      .toBe(true);

    await expect
      .poll(async () => trackerRequests.some((url) => url.includes('googletagmanager.com')))
      .toBe(true);

    await expect
      .poll(async () => trackerRequests.some((url) => url.includes('clarity.ms')))
      .toBe(true);

    await expect
      .poll(async () => trackerRequests.some((url) => url.includes('facebook.net')))
      .toBe(true);
  });
});
