import { describe, expect, it } from 'vitest';
import {
  isVarnarcHubAsset,
  resolveLoanCategoryCardImage,
  resolveLoanGuideCoverImage,
  resolveLoanHeroImage,
  LOAN_DEFAULT_CATEGORY_ASSET,
  LOAN_HERO_ASSET,
} from '@/lib/loan-visual-assets';

describe('loan visual assets', () => {
  it('detects first-party hub assets', () => {
    expect(isVarnarcHubAsset('/hub/finance/loans-hero.svg')).toBe(true);
    expect(isVarnarcHubAsset('https://cdn.example.com/hub/finance/x.svg')).toBe(true);
    expect(isVarnarcHubAsset('https://cdn.example.com/uploads/photo.jpg')).toBe(false);
    expect(isVarnarcHubAsset(null)).toBe(false);
  });

  it('prefers canonical category SVG over CMS photography', () => {
    expect(
      resolveLoanCategoryCardImage({
        slug: 'personal-loan',
        featuredImage: 'https://cdn.example.com/uploads/stock-wallet.jpg',
      }),
    ).toBe('/hub/finance/categories/personal-loan.svg');
  });

  it('resolves hub hero to shared asset when CMS is non-hub', () => {
    expect(
      resolveLoanHeroImage({
        heroImageUrl: 'https://cdn.example.com/uploads/hero.jpg',
      }),
    ).toBe(LOAN_HERO_ASSET);
  });

  it('uses category SVG for category hero', () => {
    expect(
      resolveLoanHeroImage({
        categorySlug: 'home-loan',
        heroImageUrl: 'https://cdn.example.com/uploads/house.jpg',
      }),
    ).toBe('/hub/finance/categories/home-loan.svg');
  });

  it('prefers category art for guide covers', () => {
    expect(
      resolveLoanGuideCoverImage({
        featuredUrl: 'https://cdn.example.com/uploads/guide.jpg',
        slug: 'how-to-choose-a-personal-loan',
        title: 'How to choose a personal loan',
      }),
    ).toBe('/hub/finance/categories/personal-loan.svg');
  });

  it('falls back to default category asset', () => {
    expect(
      resolveLoanGuideCoverImage({
        featuredUrl: null,
        slug: 'misc-finance-tips',
        title: 'General tips',
      }),
    ).toBe(LOAN_DEFAULT_CATEGORY_ASSET);
  });
});
