import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const locales = ['en', 'pt'] as const;

  const homeAlternates: Record<string, string> = {
    'x-default': `${siteUrl}/`,
  } as Record<string, string>;

  for (const locale of locales) {
    homeAlternates[locale] = locale === 'en' ? `${siteUrl}/` : `${siteUrl}/${locale}`;
  }

  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      alternates: {
        languages: homeAlternates,
      },
    },
  ];
}
