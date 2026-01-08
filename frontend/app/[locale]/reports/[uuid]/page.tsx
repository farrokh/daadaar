import ReportDetail from '@/components/reports/report-detail';
import { fetchApi } from '@/lib/api';
import { getSeoImageUrl } from '@/lib/seo-utils';
import type { ReportWithDetails } from '@/shared/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ locale: string; uuid: string }>;
};

async function getReport(uuid: string): Promise<ReportWithDetails | null> {
  try {
    const response = await fetchApi<ReportWithDetails>(`/share/report/${uuid}`);
    if (response.success && response.data) return response.data;
    return null;
  } catch (error) {
    console.error('Failed to fetch report:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uuid, locale } = await params;
  const report = await getReport(uuid);

  if (!report) {
    notFound();
  }

  const isRtl = locale === 'fa';
  const title = isRtl ? report.title : report.titleEn || report.title;
  const content = isRtl ? report.content : report.contentEn || report.content;
  const description = content ? `${content.slice(0, 160)}...` : 'View this report on Daadaar.';

  // Use dedicated SEO image for social media sharing
  const seoImageUrl = getSeoImageUrl('report', uuid);

  const images = [
    { url: seoImageUrl, width: 1200, height: 630, alt: title },
  ];

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: images,
      type: 'article',
      publishedTime: report.incidentDate || report.createdAt,
      siteName: 'Daadaar',
      locale: locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: images.map(img => img.url),
    },
  };
}

export default async function ReportDetailPage({ params }: Props) {
  const { uuid } = await params;
  const report = await getReport(uuid);

  if (!report) {
    notFound();
  }

  return <ReportDetail report={report} />;
}
