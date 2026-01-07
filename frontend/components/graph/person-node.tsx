'use client';

import { cn, getS3PublicUrl } from '@/lib/utils';
import { User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import BaseNodeCard from './base-node-card';
import type { PersonNodeData } from './types';

function PersonNode({ data }: NodeProps<PersonNodeData>) {
  const locale = useLocale();
  const t = useTranslations('common');
  const displayName = locale === 'en' ? data.nameEn || data.name : data.name;
  const displayBiography = locale === 'en' ? data.biographyEn || data.biography : data.biography;

  const imageUrl = data.url || (data.s3Key ? getS3PublicUrl(data.s3Key) : null);
  const isDetailView = data.isDetailView;

  const shareUrl = data.shareableUuid ? `/${locale}/person/${data.shareableUuid}` : undefined;

  return (
    <BaseNodeCard
      displayName={displayName}
      displayDescription={displayBiography}
      imageUrl={imageUrl}
      isDetailView={isDetailView}
      shareUrl={shareUrl}
      shareUrlLabel={t('view_profile')}
      fallbackIcon={<User className="w-full h-full text-secondary" />}
      iconBgClassName="bg-secondary/10"
      glowGradientClassName="from-secondary to-pink-500"
    />
  );
}

export default memo(PersonNode);
