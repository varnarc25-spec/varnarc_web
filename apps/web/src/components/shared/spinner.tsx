import { Spinner as UiSpinner } from '@varnarc/ui';

export function Spinner({
  className,
  label = 'Loading',
  size = 'md',
}: {
  className?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return <UiSpinner className={className} label={label} size={size} />;
}
