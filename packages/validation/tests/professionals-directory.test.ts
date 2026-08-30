import { describe, expect, it } from 'vitest';
import {
  buildProfessionalStructuredData,
  canIndexProfessionalLanding,
  inferProfessionalTypesFromDirectorySlugs,
  listingSourceBadges,
  parseProfessionalMetadata,
} from '../src/professionals-directory';

describe('professionals directory', () => {
  it('infers types from directory slugs', () => {
    expect(inferProfessionalTypesFromDirectorySlugs(['architects'])).toEqual(['architect']);
    expect(inferProfessionalTypesFromDirectorySlugs(['contractors'])).toContain('contractor');
  });

  it('parses metadata fields', () => {
    const m = parseProfessionalMetadata({
      experienceYears: 12,
      specialities: ['residential', 'turnkey'],
      projectTypes: ['new_home'],
      serviceArea: 'Hyderabad & Secunderabad',
      portfolio: [{ title: 'Villa A', url: 'https://example.com' }],
    });
    expect(m.experienceYears).toBe(12);
    expect(m.specialities).toContain('residential');
    expect(m.portfolio?.[0]?.title).toBe('Villa A');
  });

  it('emits structured data only when name, url and city exist', () => {
    expect(
      buildProfessionalStructuredData({
        name: 'Acme Architects',
        url: 'https://varnarc.com/construction/professionals/profile/acme',
        city: null,
      }),
    ).toBeNull();

    const ld = buildProfessionalStructuredData({
      name: 'Acme Architects',
      url: 'https://varnarc.com/construction/professionals/profile/acme',
      city: 'Hyderabad',
      professionalTypeKey: 'architect',
      phone: '+91 90000 00000',
    });
    expect(ld?.['@type']).toBe('ProfessionalService');
    expect(ld).not.toHaveProperty('aggregateRating');
  });

  it('labels listing vs verified vs sponsored distinctly', () => {
    const badges = listingSourceBadges({
      verificationStatus: 'VERIFIED',
      sponsored: true,
    });
    expect(badges.map((b) => b.key)).toEqual([
      'directory_listing',
      'verified_information',
      'sponsored_listing',
    ]);
  });

  it('gates landings on useful listing count', () => {
    expect(
      canIndexProfessionalLanding({
        typeKey: 'contractor',
        citySlug: 'hyderabad',
        listings: [{ description: 'short', status: 'APPROVED' }],
      }),
    ).toBe(false);
  });
});
