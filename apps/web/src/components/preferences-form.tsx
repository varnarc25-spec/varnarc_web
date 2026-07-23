'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@varnarc/ui';

type Prefs = {
  theme?: string | null;
  language?: string | null;
  timezone?: string | null;
  newsletterOptIn?: boolean;
  notificationSettings?: { inApp?: boolean; email?: boolean };
  privacySettings?: { profileVisibility?: string; showActivity?: boolean };
};

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
];

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
];

export function PreferencesForm() {
  const [prefs, setPrefs] = useState<Prefs>({
    theme: 'system',
    language: 'en',
    timezone: 'Asia/Kolkata',
    newsletterOptIn: false,
    notificationSettings: { inApp: true, email: true },
    privacySettings: { profileVisibility: 'PUBLIC', showActivity: true },
  });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch('/api/user/preferences')
      .then((r) => r.json())
      .then((json: { data?: Prefs }) => {
        if (json.data) {
          setPrefs((p) => ({
            ...p,
            ...json.data,
            notificationSettings: {
              inApp: true,
              email: true,
              ...json.data?.notificationSettings,
            },
            privacySettings: {
              profileVisibility: 'PUBLIC',
              showActivity: true,
              ...json.data?.privacySettings,
            },
          }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setMessage(null);
    const res = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });
    const json = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) {
      setMessage(json.error?.message || 'Save failed');
      return;
    }
    window.dispatchEvent(new CustomEvent('varnarc:prefs-saved', { detail: { theme: prefs.theme } }));
    setMessage('Preferences saved.');
  }

  if (loading) {
    return <p className="text-sm text-[var(--varnarc-subtle)]">Loading preferences…</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block text-sm">
            Theme
            <select
              className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={prefs.theme ?? 'system'}
              onChange={(e) => setPrefs((p) => ({ ...p, theme: e.target.value }))}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="block text-sm">
            Language
            <select
              className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={prefs.language ?? 'en'}
              onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Time zone
            <select
              className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={prefs.timezone ?? 'Asia/Kolkata'}
              onChange={(e) => setPrefs((p) => ({ ...p, timezone: e.target.value }))}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.notificationSettings?.inApp ?? true}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  notificationSettings: { ...p.notificationSettings, inApp: e.target.checked },
                }))
              }
            />
            In-app notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.notificationSettings?.email ?? true}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  notificationSettings: { ...p.notificationSettings, email: e.target.checked },
                }))
              }
            />
            Email notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.newsletterOptIn ?? false}
              onChange={(e) => setPrefs((p) => ({ ...p, newsletterOptIn: e.target.checked }))}
            />
            Newsletter opt-in
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block text-sm">
            Profile visibility
            <select
              className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={prefs.privacySettings?.profileVisibility ?? 'PUBLIC'}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  privacySettings: { ...p.privacySettings, profileVisibility: e.target.value },
                }))
              }
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.privacySettings?.showActivity ?? true}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  privacySettings: { ...p.privacySettings, showActivity: e.target.checked },
                }))
              }
            />
            Show activity on public profile
          </label>
        </CardContent>
      </Card>

      <Button type="button" onClick={() => void save()}>
        Save preferences
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
