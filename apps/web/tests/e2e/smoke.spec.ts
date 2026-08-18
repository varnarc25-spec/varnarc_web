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

test('car loan decision page loads', async ({ page }) => {
  await page.goto('/finance/loans/car-loan');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Plan and Compare Car Loans' }),
  ).toBeVisible();
  await expect(page.locator('#car-loan-offers')).toBeVisible();
  await expect(page.locator('#car-loan-affordability')).toBeVisible();
  await expect(page.locator('#car-loan-new-vs-used')).toBeVisible();
  await expect(page.locator('#car-loan-hypothecation')).toBeVisible();
});

test('car loan affordability calculator loads', async ({ page }) => {
  await page.goto('/calculators/car-loan-affordability');
  await expect(
    page.getByRole('heading', { level: 2, name: 'How Much Car Can You Afford?' }),
  ).toBeVisible();
});

test('education loan decision page loads', async ({ page }) => {
  await page.goto('/finance/loans/education-loan');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Plan and Compare Education Loans' }),
  ).toBeVisible();
  await expect(page.locator('#el-offers')).toBeVisible();
  await expect(page.locator('#el-government-support')).toBeVisible();
  await expect(page.locator('#el-pm-vidyalaxmi')).toBeVisible();
  await expect(page.locator('#el-study-interest')).toBeVisible();
});

test('business loan decision page loads', async ({ page }) => {
  await page.goto('/finance/loans/business-loan');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Plan and Compare Business Loans' }),
  ).toBeVisible();
  await expect(page.locator('#bl-offers')).toBeVisible();
  await expect(page.locator('#bl-cash-flow')).toBeVisible();
  await expect(page.locator('#bl-stress')).toBeVisible();
  await expect(page.locator('#bl-dscr')).toBeVisible();
  await expect(page.locator('#bl-break-even')).toBeVisible();
  await expect(page.locator('#bl-wc-vs-term')).toBeVisible();
  await expect(page.locator('#bl-government-support')).toBeVisible();
  await expect(page.locator('#bl-eligibility')).toBeVisible();
});

test('gold loan decision page loads', async ({ page }) => {
  await page.goto('/finance/loans/gold-loan');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Plan & Compare Gold Loans' }),
  ).toBeVisible();
  await expect(page.locator('#gl-offers')).toBeVisible();
  await expect(page.locator('#gl-valuation')).toBeVisible();
  await expect(page.locator('#gl-capacity')).toBeVisible();
  await expect(page.locator('#gl-gold-required')).toBeVisible();
  await expect(page.locator('#gl-risk')).toBeVisible();
  await expect(page.locator('#gl-regulatory')).toBeVisible();
});

test('loan against property decision page loads', async ({ page }) => {
  await page.goto('/finance/loans/loan-against-property');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Plan and Compare Loans Against Property' }),
  ).toBeVisible();
  await expect(page.locator('#lap-snapshot')).toBeVisible();
  await expect(page.locator('#lap-capacity')).toBeVisible();
  await expect(page.locator('#lap-offers')).toBeVisible();
  await expect(page.locator('#lap-ltv')).toBeVisible();
  await expect(page.locator('#lap-foir')).toBeVisible();
  await expect(page.locator('#lap-regulatory')).toBeVisible();
});
