import type { Metadata } from 'next';
import { AutomobileCarFinderClient } from '@/components/automobile/car-finder-client';
import { buildAutomobileMetadata } from '@/lib/automobile/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildAutomobileMetadata({
    title: 'Car Finder — Rule-based Matches | Varnarc',
    description:
      'Answer a few questions and see catalogue matches with reasons. Rule-based, not an AI score and not a sales ranking.',
    path: '/automobile/car-finder',
  });
}

export default function AutomobileCarFinderPage() {
  return <AutomobileCarFinderClient />;
}
