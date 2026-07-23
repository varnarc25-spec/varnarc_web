import { PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@varnarc/ui';
import { auth0 } from '@/lib/auth0';
import { apiServerFetch } from '@/lib/api';
import type { UserProfile } from '@/lib/user-profile';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/profile-form';
import { AccountNav } from '@/components/account-nav';

export default async function ProfilePage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect('/auth/login');
  }

  const me = await apiServerFetch<UserProfile>('/users/me');
  if (!me.data) {
    return (
      <main className="site-container py-12">
        <Card>
          <CardHeader>
            <CardTitle>Profile unavailable</CardTitle>
            <CardDescription>{me.error || 'Could not load profile from API.'}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const profile = me.data;

  return (
    <main className="site-container py-12">
      <PageHeader
        title="Your profile"
        description="Manage your public profile and account details."
        actions={<Badge>{profile.status}</Badge>}
      />
      <AccountNav />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{profile.displayName || profile.email}</CardTitle>
          <CardDescription>
            {profile.username ? `@${profile.username} · ` : ''}
            {profile.email}
            {profile.roles?.length ? ` · ${profile.roles.join(', ')}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[var(--varnarc-subtle)]">
          {profile.bio ? <p className="text-[var(--varnarc-ink)]">{profile.bio}</p> : null}
        </CardContent>
      </Card>
      <ProfileForm profile={profile} />
    </main>
  );
}
