import Link from 'next/link';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';

export function ConstructionContinueProject({
  projects,
}: {
  projects: Array<{ id: string; name: string; href: string; summary?: string | null }>;
}) {
  if (!projects.length) return null;

  return (
    <ConstructionSection
      id="continue-your-project"
      title="Continue your project"
      description="Pick up where you left off in your saved workspace."
      action={{ href: '/construction/projects', label: 'All projects →' }}
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <li key={project.id}>
            <Link
              href={project.href}
              className={cn(
                cx.card,
                'block h-full p-4 transition hover:ring-[#f97316]/40',
                cx.focus,
              )}
            >
              <h3 className="text-sm font-bold text-[#0b1f3a]">{project.name}</h3>
              {project.summary ? (
                <p className="mt-1.5 line-clamp-2 text-xs text-slate-600">{project.summary}</p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-500">Open project details</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </ConstructionSection>
  );
}
