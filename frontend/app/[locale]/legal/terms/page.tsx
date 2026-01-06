import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'legal.terms' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function TermsPage() {
  const t = useTranslations('legal.terms');
  const commonT = useTranslations('legal.common');

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="space-y-6 mb-24">
        <h1 className="text-sm font-medium uppercase text-foreground/50 border-b border-foreground/10 pb-4 tracking-[0.2em]">
          {commonT('eyebrow')}
        </h1>
        <p className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] text-foreground max-w-4xl">
          {t('title')}
        </p>
        <p className="text-lg text-foreground/60 font-light">{commonT('lastUpdated')}</p>
      </header>

      {/* 1. Introduction */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('intro_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-8">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">{t('intro_body')}</p>
        </div>
      </div>

      {/* 2. Anonymous Participation */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('anonymous_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-8">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('anonymous_body')}
          </p>
        </div>
      </div>

      {/* 3. User Responsibilities */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('responsibilities_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-6">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('responsibilities_intro')}
          </p>
          <ul className="list-disc pl-5 space-y-2 text-lg leading-relaxed text-foreground/80 font-light">
            <li>{t('resp_false')}</li>
            <li>{t('resp_law')}</li>
            <li>{t('resp_ip')}</li>
            <li>{t('resp_spam')}</li>
            <li>{t('resp_harass')}</li>
          </ul>
        </div>
      </div>

      {/* 4. Moderation */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('moderation_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-8">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('moderation_body')}
          </p>
        </div>
      </div>

      {/* 5. Disclaimer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('disclaimer_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-8">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('disclaimer_body')}
          </p>
        </div>
      </div>

      {/* 6. Liability */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('liability_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-8">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('liability_body')}
          </p>
        </div>
      </div>

      {/* 7. Changes */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('changes_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-8">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('changes_body')}
          </p>
        </div>
      </div>

      {/* 8. Governing Law */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('governing_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-8">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('governing_body')}
          </p>
        </div>
      </div>

      {/* 9. Contact */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('contact_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-8">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('contact_body')}
          </p>
        </div>
      </div>
    </div>
  );
}
