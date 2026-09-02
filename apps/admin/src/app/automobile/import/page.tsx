import { PageHeader } from '@varnarc/ui';
import { AutomobileCsvMergePanel } from '@/components/automobile-csv-merge';

export default function AutomobileImportPage() {
  return (
    <div>
      <PageHeader
        title="Automobile CSV import"
        description="Upload manufacturer, vehicle, image, and review CSVs and merge them into the catalog tables."
      />
      <AutomobileCsvMergePanel />
    </div>
  );
}
