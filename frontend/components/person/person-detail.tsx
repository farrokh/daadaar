'use client';

import { ShareLinkButton } from '@/components/ui/share-link-button';
import type { Individual } from '@/shared/types';
import { Calendar, User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface PersonDetailProps {
  person: Individual;
}

export default function PersonDetail({ person }: PersonDetailProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('person');
  const commonT = useTranslations('common');
  const orgT = useTranslations('organization');

  const isRtl = locale === 'fa';
  const name = isRtl ? person.fullName : person.fullNameEn || person.fullName;
  const biography = isRtl
    ? person.biography
    : person.biographyEn || person.biography;
  const createdDate = new Date(person.createdAt).toLocaleDateString(locale, {
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
              {t('person_id')}: {person.shareableUuid.slice(0, 8)}
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
          {/* Profile Image / Icon Placeholder */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 border border-foreground/10 overflow-hidden">
            {person.profileImageUrl ? (
              <img
                src={person.profileImageUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-foreground/20" />
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
                  {orgT('added_on')} {createdDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-2 space-y-12">
          {/* Biography */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase text-foreground/40 tracking-widest">
              {t('biography')}
            </h2>
            <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {biography || t('no_biography')}
            </p>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
           {/* Placeholder for future specific details */}
        </div>
      </div>
    </div>
  );
}
