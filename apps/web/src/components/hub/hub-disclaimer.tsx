import { Info } from 'lucide-react';

export function HubDisclaimer({ text }: { text: string }) {
  return (
    <div className="site-container px-4 pb-10">
      <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <span>{text}</span>
      </p>
    </div>
  );
}
