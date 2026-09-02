'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/services/api-client';

export function AutomobileVehicleImage({
  src,
  alt,
  vehicleId,
  attribution,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  vehicleId?: string;
  attribution?: string | null;
  priority?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(src ?? null);
  const [credit, setCredit] = useState<string | null>(attribution ?? null);

  useEffect(() => {
    setUrl(src ?? null);
  }, [src]);

  useEffect(() => {
    if (url || !vehicleId) return;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`${getApiBaseUrl()}/automobile/vehicles/${vehicleId}/image`, {
        signal: ctrl.signal,
      })
        .then((res) => res.json())
        .then((json: { data?: { imageUrl?: string | null; attribution?: string | null } }) => {
          if (json.data?.imageUrl) {
            setUrl(json.data.imageUrl);
            setCredit(json.data.attribution ?? null);
          }
        })
        .catch(() => undefined);
    }, 80);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [url, vehicleId]);

  const initial = alt.trim().charAt(0).toUpperCase() || 'C';

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          priority={priority}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0b1f3a] to-slate-600 text-4xl font-extrabold text-white">
          <span aria-hidden="true">{initial}</span>
          <span className="sr-only">{alt}</span>
        </div>
      )}
      {credit ? (
        <p className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-0.5 text-[10px] text-white">
          {credit}
        </p>
      ) : null}
    </div>
  );
}
