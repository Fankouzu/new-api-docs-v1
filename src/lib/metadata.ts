import type { Metadata } from 'next';

export const siteIcons: Metadata['icons'] = {
  icon: [
    { url: '/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
    { url: '/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
    { url: '/favicon.ico?v=2', sizes: 'any' },
  ],
  shortcut: '/favicon.ico',
  apple: '/apple-touch-icon.png?v=2',
};

export function createMetadata(override: Metadata): Metadata {
  return {
    ...override,
    icons: siteIcons,
    openGraph: {
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      url: 'https://www.newapi.ai',
      images: '/assets/auth_logo.png',
      siteName: 'New API',
      type: 'website',
      ...override.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      images: '/assets/auth_logo.png',
      ...override.twitter,
    },
  };
}

export const baseUrl =
  process.env.NODE_ENV === 'development' ||
  !process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? new URL('http://localhost:3000')
    : new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
