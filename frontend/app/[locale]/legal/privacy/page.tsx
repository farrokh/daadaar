import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'legal.privacyPolicy' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function PrivacyPage() {
  const t = useTranslations('legal.privacyPolicy');
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

      {/* 1. Commitment */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('commitment_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-8">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('commitment_body')}
          </p>
        </div>
      </div>

      {/* 2. DO NOT Collect */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('not_collected_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-6">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            <strong className="font-medium text-foreground">{t('zero_ip_title')}</strong>{' '}
            {t('zero_ip_body')}
          </p>
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            <strong className="font-medium text-foreground">{t('no_tracking_title')}</strong>{' '}
            {t('no_tracking_body')}
          </p>
        </div>
      </div>

      {/* 3. We Collect */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('collected_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-10">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">{t('sessions_title')}</h3>
            <p className="text-lg leading-relaxed text-foreground/80 font-light">
              {t('sessions_body')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-lg leading-relaxed text-foreground/80 font-light">
              <li>{t('sessions_list_1')}</li>
              <li>{t('sessions_list_2')}</li>
            </ul>
            <p className="text-lg leading-relaxed text-foreground/80 font-light">
              {t('sessions_note')}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">{t('account_title')}</h3>
            <p className="text-lg leading-relaxed text-foreground/80 font-light">
              {t('account_intro')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-lg leading-relaxed text-foreground/80 font-light">
              <li>{t('account_list_1')}</li>
              <li>{t('account_list_2')}</li>
              <li>{t('account_list_3')}</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">{t('submissions_title')}</h3>
            <p className="text-lg leading-relaxed text-foreground/80 font-light">
              {t('submissions_body')}
            </p>
          </div>
        </div>
      </div>

      {/* 4. How We Use */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('usage_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-6">
          <ul className="list-disc pl-5 space-y-4 text-lg leading-relaxed text-foreground/80 font-light">
            <li>
              <strong className="font-medium text-foreground">{t('usage_security_title')}</strong>{' '}
              {t('usage_security_body')}
            </li>
            <li>
              <strong className="font-medium text-foreground">{t('usage_operation_title')}</strong>{' '}
              {t('usage_operation_body')}
            </li>
          </ul>
        </div>
      </div>

      {/* 5. Cookies */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('cookies_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-6">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('cookies_intro')}
          </p>
          <ul className="list-disc pl-5 space-y-2 text-lg leading-relaxed text-foreground/80 font-light">
            <li>{t('cookies_list_1')}</li>
            <li>{t('cookies_list_2')}</li>
            <li>{t('cookies_list_3')}</li>
          </ul>
          <p className="text-lg leading-relaxed text-foreground/80 font-light italic">
            {t('cookies_note')}
          </p>
        </div>
      </div>

      {/* 6. Data Security */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('security_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-6">
          <ul className="list-disc pl-5 space-y-4 text-lg leading-relaxed text-foreground/80 font-light">
            <li>
              <strong className="font-medium text-foreground">
                {t('security_encryption_title')}
              </strong>{' '}
              {t('security_encryption_body')}
            </li>
            <li>
              <strong className="font-medium text-foreground">
                {t('security_retention_title')}
              </strong>{' '}
              {t('security_retention_body')}
            </li>
          </ul>
        </div>
      </div>

      {/* 7. Third Party */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('thirdparty_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-6">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('thirdparty_intro')}
          </p>
          <ul className="list-disc pl-5 space-y-2 text-lg leading-relaxed text-foreground/80 font-light">
            <li>
              <strong>{t('thirdparty_cf')}</strong> {t('thirdparty_cf_desc')}
            </li>
            <li>
              <strong>{t('thirdparty_aws')}</strong> {t('thirdparty_aws_desc')}
            </li>
            <li>
              <strong>{t('thirdparty_openai')}</strong> {t('thirdparty_openai_desc')}
            </li>
          </ul>
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('thirdparty_note')}
          </p>
        </div>
      </div>

      {/* 8. Contact */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('contact_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-6">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('contact_updates')}
          </p>
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('contact_body')}
          </p>
        </div>
      </div>
    </div>
  );
}
