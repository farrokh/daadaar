import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'legal.contentPolicy' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function ContentPolicyPage() {
  const t = useTranslations('legal.contentPolicy');
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

      {/* Sections */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('purpose_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-8">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('purpose_body')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('prohibited_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-6">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('prohibited_intro')}
          </p>
          <ul className="space-y-4">
            <li className="text-lg leading-relaxed text-foreground/80 font-light">
              <strong className="font-medium text-foreground">{t('prohibited_hate_title')}</strong>{' '}
              {t('prohibited_hate_body')}
            </li>
            <li className="text-lg leading-relaxed text-foreground/80 font-light">
              <strong className="font-medium text-foreground">
                {t('prohibited_harassment_title')}
              </strong>{' '}
              {t('prohibited_harassment_body')}
            </li>
            <li className="text-lg leading-relaxed text-foreground/80 font-light">
              <strong className="font-medium text-foreground">{t('prohibited_spam_title')}</strong>{' '}
              {t('prohibited_spam_body')}
            </li>
            <li className="text-lg leading-relaxed text-foreground/80 font-light">
              <strong className="font-medium text-foreground">
                {t('prohibited_illegal_title')}
              </strong>{' '}
              {t('prohibited_illegal_body')}
            </li>
            <li className="text-lg leading-relaxed text-foreground/80 font-light">
              <strong className="font-medium text-foreground">{t('prohibited_false_title')}</strong>{' '}
              {t('prohibited_false_body')}
            </li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('verification_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-8">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('verification_body')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('reporting_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-8">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('reporting_body')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('appeal_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-8">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('appeal_body')}
          </p>
        </div>
      </div>
    </div>
  );
}
