import { test, expect, devices } from '@playwright/test';

test.describe('construction calculators responsive', () => {
  test.use({ ...devices['iPhone 12'] });

  test('cost calculator does not overflow horizontally', async ({ page }) => {
    await page.goto('/construction/cost-calculator');
    await expect(page.locator('body')).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 8);
  });
});
