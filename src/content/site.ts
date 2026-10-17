// Public contact channels. Fill `email` once a real support inbox exists —
// it is hidden everywhere while empty (never ship a placeholder address).
export const SITE = {
  email: '',
  socials: [
    { label: 'Discord', href: 'https://discord.com' },
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'LinkedIn', href: 'https://linkedin.com' },
  ],
} as const;

export const DISCORD_URL = SITE.socials[0].href;

// Legal entity details used in the legal drafts ({{ENTITY}}, {{COUNTRY}}, {{EMAIL}}).
// Leave a field empty until it is confirmed — the pages then show "[to be confirmed]".
export const LEGAL = {
  entity: 'Clipte',
  country: { en: '', ru: '', kk: '' },
  effective: '2026-10-11',
} as const;
