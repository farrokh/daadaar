import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://daadaar.org';

  // Static routes
  const routes = [
    '',
    '/en',
    '/fa',
    '/en/about',
    '/fa/about',
    '/en/reports',
    '/fa/reports',
    '/en/updates',
    '/fa/updates',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' || route === '/en' || route === '/fa' ? 1 : 0.8,
  }));

  return routes;
}
