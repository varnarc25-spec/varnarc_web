import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('articles page loads', async ({ page }) => {
  await page.goto('/articles');
  await expect(page.getByRole('heading', { level: 1, name: 'Articles' })).toBeVisible();
});

test('tags page loads', async ({ page }) => {
  await page.goto('/tags');
  await expect(page.getByRole('heading', { level: 1, name: 'Tags' })).toBeVisible();
});

test('compare index loads', async ({ page }) => {
  await page.goto('/compare');
  await expect(page.getByRole('heading', { level: 1, name: 'Comparisons' })).toBeVisible();
});

test('compare slug route responds', async ({ page }) => {
  await page.goto('/compare/products');
  await expect(page.locator('body')).toBeVisible();
});
