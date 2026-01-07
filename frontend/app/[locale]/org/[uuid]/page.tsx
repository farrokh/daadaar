'use client';

import { Button } from '@/components/ui/button';
import { ShareLinkButton } from '@/components/ui/share-link-button';
import { fetchApi } from '@/lib/api';
import type { Organization } from '@/shared/types';
import { Building2, Calendar, ChevronRight, Globe, Network } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('organization'); // We might need to add keys here or use common
  const commonT = useTranslations('common');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Logic
  useEffect(() => {
    const fetchOrg = async () => {
      setLoading(true);
      try {
        const response = await fetchApi<Organization>(`/share/org/${params.uuid}`);
        if (response.success && response.data) setOrganization(response.data);
        else setError(response.error?.message || commonT('error_not_found'));
      } catch (_err) {
        setError(commonT('error_generic'));
      } finally {
        setLoading(false);
      }
    };
    if (params.uuid) fetchOrg();
  }, [params.uuid, commonT]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-32 px-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen pt-32 pb-32 px-6 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <h1 className="text-xl font-medium text-foreground mb-6">
          {error || commonT('error_not_found')}
        </h1>
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          className="text-xs font-medium uppercase tracking-wider"
        >
          ← {commonT('cancel')}
        </Button>
      </div>
    );
  }

  const isRtl = locale === 'fa';
  const name = isRtl ? organization.name : organization.nameEn || organization.name;
  const description = isRtl
    ? organization.description
    : organization.descriptionEn || organization.description;
  const createdDate = new Date(organization.createdAt).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen pt-32 pb-32 px-6 md:px-12 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <header className="mb-16 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-foreground/10 pb-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm font-medium uppercase text-foreground/50 hover:text-foreground transition-colors tracking-[0.2em]"
            >
              {commonT('home')}
            </button>
            <span className="text-foreground/20">/</span>
            <span className="text-sm font-medium uppercase text-foreground/50 tracking-[0.2em]">
              {t('org_id')}: {organization.shareableUuid.slice(0, 8)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ShareLinkButton
              label={commonT('share')}
              copiedLabel={commonT('copied')}
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/70 transition-colors bg-transparent border-none"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          {/* Logo / Icon Placeholder */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-foreground/5 flex items-center justify-center shrink-0 border border-foreground/10">
            {organization.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt={name}
                className="w-full h-full object-cover rounded-3xl"
              />
            ) : (
              <Building2 className="w-12 h-12 text-foreground/20" />
            )}
          </div>

          <div className="space-y-4">
            <h1
              className={`text-3xl md:text-5xl font-black text-foreground ${isRtl ? 'leading-normal' : 'tracking-tight leading-none'}`}
            >
              {name}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {t('added_on')} {createdDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-2 space-y-12">
          {/* Description */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase text-foreground/40 tracking-widest">
              {t('about')}
            </h2>
            <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {description || t('no_description')}
            </p>
          </section>

          {/* Graph Link */}
          <section className="pt-8 border-t border-foreground/10">
            <div className="bg-foreground/5 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-start">
                <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2">
                  <Network className="w-5 h-5" />
                  {t('view_on_graph')}
                </h3>
                <p className="text-foreground/60 max-w-md">{t('graph_description')}</p>
              </div>
              <Button
                size="lg"
                onClick={() =>
                  router.push(`/?view=people&organizationUuid=${organization.shareableUuid}`)
                }
                className="rounded-full px-8"
              >
                {t('explore_graph')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          {organization.parentId && (
            <div className="p-6 rounded-2xl border border-foreground/10 space-y-4">
              <h3 className="text-xs font-bold uppercase text-foreground/40 tracking-widest">
                {t('parent_org')}
              </h3>
              {/* Note: We handle fetching parent info or linking to it if we had the UUID.
                  Currently the share API returns parentId but not parent UUID or Name in the base response.
                  For now we might skip or we need to update the backend to Include parent details.
              */}
              <div className="flex items-center gap-2 text-foreground/60">
                <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-sm">ID: {organization.parentId}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
