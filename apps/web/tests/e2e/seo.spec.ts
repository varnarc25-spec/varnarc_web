import { test, expect } from '@playwright/test';

test('robots.txt is served with crawler directives', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.ok()).toBeTruthy();
  const text = await res.text();
  expect(text).toMatch(/User-agent:/i);
});

test('home page has document title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});

test('home page exposes meta description or og:description', async ({ page }) => {
  await page.goto('/');
  const metaDescription = page.locator('meta[name="description"]');
  const ogDescription = page.locator('meta[property="og:description"]');
  const hasMeta =
    (await metaDescription.count()) > 0 || (await ogDescription.count()) > 0;
  expect(hasMeta).toBe(true);
});

test('home page has canonical or og:url', async ({ page }) => {
  await page.goto('/');
  const canonical = page.locator('link[rel="canonical"]');
  const ogUrl = page.locator('meta[property="og:url"]');
  const hasUrl = (await canonical.count()) > 0 || (await ogUrl.count()) > 0;
  expect(hasUrl).toBe(true);
});
