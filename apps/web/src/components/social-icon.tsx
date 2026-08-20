import type { ReactNode } from 'react';

type SocialKind = 'facebook' | 'x' | 'instagram' | 'youtube' | 'linkedin' | 'generic';

const BRAND_COLORS: Record<SocialKind, string> = {
  facebook: '#1877F2',
  x: '#000000',
  instagram: '#E4405F',
  youtube: '#FF0000',
  linkedin: '#0A66C2',
  generic: 'rgba(255,255,255,0.1)',
};

function detectSocial(label: string, href: string): SocialKind {
  const hay = `${label} ${href}`.toLowerCase();
  if (hay.includes('facebook') || hay.includes('fb.com')) return 'facebook';
  if (hay.includes('instagram') || hay.includes('instagr.am')) return 'instagram';
  if (hay.includes('youtube') || hay.includes('youtu.be')) return 'youtube';
  if (hay.includes('linkedin')) return 'linkedin';
  if (
    hay.includes('twitter') ||
    hay.includes('x.com') ||
    /(^|\W)x(\W|$)/.test(label.toLowerCase()) ||
    label.trim().toLowerCase() === 't'
  ) {
    return 'x';
  }
  const letter = label.trim().toLowerCase();
  if (letter === 'f') return 'facebook';
  if (letter === 'i') return 'instagram';
  if (letter === 'y') return 'youtube';
  if (letter === 'l') return 'linkedin';
  return 'generic';
}

export function getSocialBrandColor(label: string, href: string): string {
  return BRAND_COLORS[detectSocial(label, href)];
}

function IconSvg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current" focusable="false">
      {children}
    </svg>
  );
}

export function SocialIcon({ label, href }: { label: string; href: string }) {
  const kind = detectSocial(label, href);
  const accessible = label.trim().length > 1 ? label : kind === 'x' ? 'X' : kind;

  let icon: ReactNode;
  switch (kind) {
    case 'facebook':
      icon = (
        <IconSvg>
          <path d="M14 8.2h2.4V5H14c-2.5 0-4.2 1.7-4.2 4.3V12H7.5v3.2h2.3V22h3.4v-6.8H16l.5-3.2h-3.2V9.6c0-.8.4-1.4 1.4-1.4Z" />
        </IconSvg>
      );
      break;
    case 'x':
      icon = (
        <IconSvg>
          <path d="M17.6 4h2.3l-5.1 5.8L21 20h-4.7l-3.7-4.8L8.3 20H6l5.5-6.3L3.5 4H8.3l3.3 4.4L17.6 4Zm-.8 14.4h1.3L7.7 5.5H6.3l10.5 12.9Z" />
        </IconSvg>
      );
      break;
    case 'instagram':
      icon = (
        <IconSvg>
          <path d="M12 7.4A4.6 4.6 0 1 0 12 16.6 4.6 4.6 0 0 0 12 7.4Zm0 7.6A3 3 0 1 1 12 9a3 3 0 0 1 0 6Zm5.1-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 3.5c-2.3 0-2.6 0-3.5.1-1.8.1-3.2 1.5-3.3 3.3-.1.9-.1 1.2-.1 3.5s0 2.6.1 3.5c.1 1.8 1.5 3.2 3.3 3.3.9.1 1.2.1 3.5.1s2.6 0 3.5-.1c1.8-.1 3.2-1.5 3.3-3.3.1-.9.1-1.2.1-3.5s0-2.6-.1-3.5c-.1-1.8-1.5-3.2-3.3-3.3-.9-.1-1.2-.1-3.5-.1Zm0 1.5c2.3 0 2.5 0 3.4.1 1.3.1 2 1 2.1 2.1.1.9.1 1.1.1 3.4s0 2.5-.1 3.4c-.1 1.1-.8 2-2.1 2.1-.9.1-1.1.1-3.4.1s-2.5 0-3.4-.1c-1.3-.1-2-1-2.1-2.1-.1-.9-.1-1.1-.1-3.4s0-2.5.1-3.4c.1-1.1.8-2 2.1-2.1.9-.1 1.1-.1 3.4-.1Z" />
        </IconSvg>
      );
      break;
    case 'youtube':
      icon = (
        <IconSvg>
          <path d="M21.6 8.1a2.7 2.7 0 0 0-1.9-1.9C18 5.8 12 5.8 12 5.8s-6 0-7.7.4A2.7 2.7 0 0 0 2.4 8.1 28.2 28.2 0 0 0 2 12a28.2 28.2 0 0 0 .4 3.9 2.7 2.7 0 0 0 1.9 1.9c1.7.4 7.7.4 7.7.4s6 0 7.7-.4a2.7 2.7 0 0 0 1.9-1.9A28.2 28.2 0 0 0 22 12a28.2 28.2 0 0 0-.4-3.9ZM10 15.2V8.8l5.2 3.2L10 15.2Z" />
        </IconSvg>
      );
      break;
    case 'linkedin':
      icon = (
        <IconSvg>
          <path d="M6.3 9.4H3.5V20h2.8V9.4ZM4.9 4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2ZM20.5 13.2c0-3-1.6-4.4-3.8-4.4-1.7 0-2.5.9-2.9 1.6V9.4h-2.8c0 .8 0 10.6 0 10.6h2.8v-5.9c0-.3 0-.6.1-.9.3-.6.9-1.3 1.9-1.3 1.3 0 1.9 1 1.9 2.5V20h2.8v-6.8Z" />
        </IconSvg>
      );
      break;
    default:
      icon = <span className="text-xs font-bold">{label.slice(0, 1).toUpperCase()}</span>;
  }

  return (
    <span className="inline-flex items-center justify-center" title={accessible}>
      <span className="sr-only">{accessible}</span>
      {icon}
    </span>
  );
}
