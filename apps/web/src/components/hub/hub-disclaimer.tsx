import { Info } from 'lucide-react';

export function HubDisclaimer({ text }: { text: string }) {
  return (
    <div className="full-bleed border-t border-slate-200 bg-slate-50">
      <div className="site-container py-5">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <span>{text}</span>
        </p>
      </div>
    </div>
  );
}
