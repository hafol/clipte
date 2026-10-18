import type { MetadataRoute } from 'next';

// Search engines: everything public, nothing behind sign-in.
export default function robots(): MetadataRoute.Robots {
  const site = (process.env.NEXT_PUBLIC_APP_URL || 'https://clipte.vercel.app').replace(/\/$/, '');
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/api', '/auth', '/brand/'] }],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
