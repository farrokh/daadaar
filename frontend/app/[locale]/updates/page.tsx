import { UpdatesFeed } from '@/components/updates/updates-feed';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'updates' });

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      siteName: 'Daadaar',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
  };
}

export default async function UpdatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Dynamic import to ensure we get the latest built data
  const updates = (await import('@/data/updates.json')).default;

  // JSON-LD for SEO & AEO (Answer Engine Optimization)
  // Providing structured data helps AI agents understand this is a changelog/updates page
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Daadaar Platform',
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Web',
    description:
      'Decentralized platform for transparency and justice, mapping relationships within the Iranian government.',
    releaseNotes: `Latest updates as of ${updates[0]?.date || new Date().toISOString()}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: updates.slice(0, 10).map((u, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'BlogPosting',
          headline: `Project Updates - ${u.date}`,
          datePublished: u.date,
          author: {
            '@type': 'Organization',
            name: 'Daadaar Team',
          },
          articleBody:
            u.public
              .map(c =>
                typeof c.message === 'string'
                  ? c.message
                  : c.message[locale as 'en' | 'fa'] ||
                    (c.message as any).en ||
                    Object.values(c.message)[0] ||
                    ''
              )
              .join('. ') || 'Technical maintenance and improvements.',
        },
      })),
    },
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Trusted JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <UpdatesFeed updates={updates} locale={locale} />
    </div>
  );
}
