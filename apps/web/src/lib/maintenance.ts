const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type MaintenanceStatus = {
  active: boolean;
  message?: string | null;
  readOnly?: boolean;
};

let cache: { status: MaintenanceStatus; expires: number } | null = null;

export async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
  const now = Date.now();
  if (cache && cache.expires > now) return cache.status;

  try {
    const res = await fetch(`${apiUrl}/settings/maintenance/status`, { next: { revalidate: 30 } });
    const json = (await res.json()) as { data?: MaintenanceStatus };
    const status = json.data ?? { active: false };
    cache = { status, expires: now + 30_000 };
    return status;
  } catch {
    return cache?.status ?? { active: false };
  }
}
