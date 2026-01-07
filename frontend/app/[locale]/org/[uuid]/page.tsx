import OrganizationDetail from '@/components/organization/organization-detail';
import { fetchApi } from '@/lib/api';
import type { Organization } from '@/shared/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ locale: string; uuid: string }>;
};

async function getOrganization(uuid: string): Promise<Organization | null> {
  try {
    const response = await fetchApi<Organization>(`/share/org/${uuid}`);
    if (response.success && response.data) return response.data;
    return null;
  } catch (error) {
    console.error('Failed to fetch organization:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uuid, locale } = await params;
  const organization = await getOrganization(uuid);

  if (!organization) {
    return {
      title: 'Organization Not Found',
    };
  }

  const isRtl = locale === 'fa';
  const name = isRtl ? organization.name : organization.nameEn || organization.name;
  const description = isRtl
    ? organization.description
    : organization.descriptionEn || organization.description;

  const images = [];
  if (organization.logoUrl) {
    images.push({ url: organization.logoUrl });
  }
  images.push({ url: '/android-chrome-512x512.png', width: 512, height: 512, alt: name });

  return {
    title: name,
    description: description || `View the profile of ${name} on Daadaar.`,
    openGraph: {
      title: name,
      description: description || `View the profile of ${name} on Daadaar.`,
      images: images,
      type: 'website',
      siteName: 'Daadaar',
      locale: locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description: description || `View the profile of ${name} on Daadaar.`,
      images: images.map(img => img.url),
    },
  };
}

export default async function OrganizationDetailPage({ params }: Props) {
  const { uuid } = await params;
  const organization = await getOrganization(uuid);

  if (!organization) {
    notFound();
  }

  return <OrganizationDetail organization={organization} />;
}
