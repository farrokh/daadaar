'use client';

import { cn, getS3PublicUrl } from '@/lib/utils';
import { Building2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import BaseNodeCard from './base-node-card';
import type { OrganizationNodeData } from './types';

function OrganizationNode({ data }: NodeProps<OrganizationNodeData>) {
  const locale = useLocale();
  const displayName = locale === 'en' ? data.nameEn || data.name : data.name;
  const displayDescription =
    locale === 'en' ? data.descriptionEn || data.description : data.description;

  const imageUrl = data.url || (data.s3Key ? getS3PublicUrl(data.s3Key) : null);
  const isDetailView = data.isDetailView;

  return (
    <BaseNodeCard
      displayName={displayName}
      displayDescription={displayDescription}
      imageUrl={imageUrl}
      isDetailView={isDetailView}
      fallbackIcon={<Building2 className="w-full h-full text-primary" />}
      iconBgClassName="bg-primary/10"
      glowGradientClassName="from-primary to-accent-secondary"
    />
  );
}

export default memo(OrganizationNode);
