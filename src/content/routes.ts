// Single source of truth for Clipte's public routes (footer, menu, CTAs).
// Every footer / menu / CTA link should come from here.

export const ROUTES = {
  home: '/',
  register: '/register',
  login: '/login',
  dashboard: '/dashboard',
  campaigns: '/dashboard/campaigns',

  // Product
  clip: '/clip',
  brands: '/brands',
  enterprise: '/enterprise',
  docs: '/docs',

  // Guides
  blog: '/blog',
  guide: (slug: string) => `/guides/${slug}`,

  // Compare
  compare: '/compare',
  compareWith: (slug: string) => `/compare/${slug}`,

  // Legal (drafts — need legal review before launch)
  legal: (slug: string) => `/legal/${slug}`,

  contact: '/contact',
  contactBrands: '/contact?topic=brands',
} as const;

/** Routes that render the landing design system (smooth scroll, custom scrollbar). */
export const PI_ROUTE_PREFIXES = ['/blog', '/guides', '/contact', '/clip', '/brands', '/enterprise', '/docs', '/compare', '/legal'];

export const isPiRoute = (pathname: string) =>
  pathname === '/' || PI_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
