import ReportDetail from '@/components/reports/report-detail';
import { fetchApi } from '@/lib/api';
import { getS3PublicUrl } from '@/lib/utils';
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
    return {
      title: 'Report Not Found',
    };
  }

  const isRtl = locale === 'fa';
  const title = isRtl ? report.title : report.titleEn || report.title;
  const content = isRtl ? report.content : report.contentEn || report.content;
  const description = content ? `${content.slice(0, 160)}...` : 'View this report on Daadaar.';

  // Find first image for OG tag
  const firstImage = report.media?.find(m => m.mediaType === 'image');
  const imageUrl = firstImage
    ? firstImage.url || getS3PublicUrl(firstImage.s3Key, firstImage.s3Bucket)
    : undefined;

  const images = [];
  if (imageUrl) {
    images.push({ url: imageUrl });
  }
  images.push({ url: '/android-chrome-512x512.png', width: 512, height: 512, alt: title });

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
