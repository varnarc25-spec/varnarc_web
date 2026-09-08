import { redirect } from 'next/navigation';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BoqGeneratorRedirectPage({ searchParams }: Props) {
  const params = await searchParams;
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.trim()) sp.set(key, value);
    if (Array.isArray(value) && value[0]) sp.set(key, value[0]);
  }
  const q = sp.toString();
  redirect(q ? `/construction/boq?${q}` : '/construction/boq');
}
