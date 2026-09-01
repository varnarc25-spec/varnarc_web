import { AutomobileResearchListing, automobileResearchMetadata } from '@/components/automobile/research-listing';

export const generateMetadata = () => automobileResearchMetadata('specifications');
export const revalidate = 60;

export default function AutomobileSpecificationsPage() {
  return <AutomobileResearchListing pageKey="specifications" />;
}
