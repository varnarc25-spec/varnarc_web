import { AutomobileResearchListing, automobileResearchMetadata } from '@/components/automobile/research-listing';

export const generateMetadata = () => automobileResearchMetadata('prices');
export const revalidate = 60;

export default function AutomobilePricesPage() {
  return <AutomobileResearchListing pageKey="prices" />;
}
