'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@varnarc/ui';
import type { UserProfile } from '@/lib/user-profile';
import { AvatarUpload } from '@/components/avatar-upload';

const inputClass = 'h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3';
const textareaClass = 'w-full rounded-md border border-[var(--varnarc-border)] p-3 text-sm';

const SOCIAL_FIELDS = [
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
  { key: 'instagram', label: 'Instagram' },
] as const;

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const initialSocial = (profile.socialLinks ?? {}) as Record<string, string>;
  const [form, setForm] = useState({
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    displayName: profile.displayName ?? '',
    username: profile.username ?? '',
    phone: profile.phone ?? '',
    bio: profile.bio ?? '',
    country: profile.country ?? '',
    state: profile.state ?? '',
    city: profile.city ?? '',
    language: profile.language ?? '',
    timezone: profile.timezone ?? '',
    website: profile.website ?? '',
    profileVisibility: profile.profileVisibility ?? 'PUBLIC',
    socialLinks: {
      twitter: initialSocial.twitter ?? '',
      linkedin: initialSocial.linkedin ?? '',
      github: initialSocial.github ?? '',
      instagram: initialSocial.instagram ?? '',
    },
  });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setLoading(true);
    setMessage(null);
    const socialLinks = Object.fromEntries(
      Object.entries(form.socialLinks).filter(([, v]) => v.trim()),
    );
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName || null,
          lastName: form.lastName || null,
          displayName: form.displayName || null,
          username: form.username || null,
          phone: form.phone || null,
          bio: form.bio || null,
          country: form.country || null,
          state: form.state || null,
          city: form.city || null,
          language: form.language || null,
          timezone: form.timezone || null,
          website: form.website || null,
          profileVisibility: form.profileVisibility,
          socialLinks: Object.keys(socialLinks).length ? socialLinks : null,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to save');
      setMessage('Profile saved.');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AvatarUpload
          avatarUrl={profile.avatarUrl}
          displayName={profile.displayName || profile.email}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">First name</span>
            <input className={inputClass} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Last name</span>
            <input className={inputClass} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Display name</span>
          <input className={inputClass} value={form.displayName} onChange={(e) => set('displayName', e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Username</span>
          <input
            className={inputClass}
            value={form.username}
            onChange={(e) => set('username', e.target.value)}
            placeholder="letters, numbers, . _ -"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Bio</span>
          <textarea className={textareaClass} rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Phone</span>
          <input className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Country</span>
            <input className={inputClass} value={form.country} onChange={(e) => set('country', e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">State</span>
            <input className={inputClass} value={form.state} onChange={(e) => set('state', e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">City</span>
            <input className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)} />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Language</span>
            <input className={inputClass} value={form.language} onChange={(e) => set('language', e.target.value)} placeholder="en" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Time zone</span>
            <input className={inputClass} value={form.timezone} onChange={(e) => set('timezone', e.target.value)} placeholder="Asia/Kolkata" />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Website</span>
          <input className={inputClass} type="url" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {SOCIAL_FIELDS.map((field) => (
            <label key={field.key} className="block text-sm">
              <span className="mb-1 block text-[var(--varnarc-subtle)]">{field.label}</span>
              <input
                className={inputClass}
                type="url"
                value={form.socialLinks[field.key]}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    socialLinks: { ...f.socialLinks, [field.key]: e.target.value },
                  }))
                }
                placeholder="https://"
              />
            </label>
          ))}
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Profile visibility</span>
          <select
            className={inputClass}
            value={form.profileVisibility}
            onChange={(e) => set('profileVisibility', e.target.value as 'PUBLIC' | 'PRIVATE')}
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </label>
        <Button disabled={loading} onClick={() => void save()}>
          Save profile
        </Button>
        {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
