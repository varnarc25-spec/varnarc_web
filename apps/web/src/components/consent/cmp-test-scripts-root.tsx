import { isCmpConfigured } from '@/lib/cmp-config';
import { isCmpTestScriptsEnabled } from '@/lib/cmp-test-scripts-config';
import { CmpTestScripts } from './cmp-test-scripts';

export function CmpTestScriptsRoot() {
  if (!isCmpConfigured() || !isCmpTestScriptsEnabled()) return null;
  return <CmpTestScripts />;
}
