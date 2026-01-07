'use client';

import { cn, getS3PublicUrl } from '@/lib/utils';
import { User } from 'lucide-react';
import { useLocale } from 'next-intl';
import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import BaseNodeCard from './base-node-card';
import type { PersonNodeData } from './types';

function PersonNode({ data }: NodeProps<PersonNodeData>) {
  const locale = useLocale();
  const displayName = locale === 'en' ? data.nameEn || data.name : data.name;
  const displayBiography = locale === 'en' ? data.biographyEn || data.biography : data.biography;

  const imageUrl = data.url || (data.s3Key ? getS3PublicUrl(data.s3Key) : null);
  const isDetailView = data.isDetailView;

  return (
    <BaseNodeCard
      displayName={displayName}
      displayDescription={displayBiography}
      imageUrl={imageUrl}
      isDetailView={isDetailView}
      fallbackIcon={<User className="w-full h-full text-secondary" />}
      iconBgClassName="bg-secondary/10"
      glowGradientClassName="from-secondary to-pink-500"
    />
  );
}

export default memo(PersonNode);
