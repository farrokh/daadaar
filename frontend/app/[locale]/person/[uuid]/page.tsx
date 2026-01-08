import PersonDetail from '@/components/person/person-detail';
import { fetchApi } from '@/lib/api';
import { getSeoImageUrl } from '@/lib/seo-utils';
import type { Individual } from '@/shared/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ locale: string; uuid: string }>;
};

async function getPerson(uuid: string): Promise<Individual | null> {
  try {
    const response = await fetchApi<Individual>(`/share/individual/${uuid}`);
    if (response.success && response.data) return response.data;
    return null;
  } catch (error) {
    console.error('Failed to fetch person:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uuid, locale } = await params;
  const person = await getPerson(uuid);

  if (!person) {
    return {
      title: 'Person Not Found',
    };
  }

  const isRtl = locale === 'fa';
  const name = isRtl ? person.fullName : person.fullNameEn || person.fullName;
  const biography = isRtl ? person.biography : person.biographyEn || person.biography;
  const description = biography
    ? `${biography.slice(0, 160)}...`
    : `View the profile of ${name} on Daadaar.`;

  // Use dedicated SEO image for social media sharing
  const seoImageUrl = getSeoImageUrl('individual', uuid);

  const images = [{ url: seoImageUrl, width: 1200, height: 630, alt: name }];

  return {
    title: name,
    description: description,
    openGraph: {
      title: name,
      description: description,
      images: images,
      type: 'profile',
      siteName: 'Daadaar',
      locale: locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description: description,
      images: images.map(img => img.url),
    },
  };
}

export default async function PersonDetailPage({ params }: Props) {
  const { uuid } = await params;
  const person = await getPerson(uuid);

  if (!person) {
    notFound();
  }

  return <PersonDetail person={person} />;
}
