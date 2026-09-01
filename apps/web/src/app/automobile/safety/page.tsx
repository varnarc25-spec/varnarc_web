import { AutomobileResearchListing, automobileResearchMetadata } from '@/components/automobile/research-listing';

export const generateMetadata = () => automobileResearchMetadata('safety');
export const revalidate = 60;

export default function AutomobileSafetyPage() {
  return <AutomobileResearchListing pageKey="safety" />;
}
