import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'legal.copyright' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function CopyrightPage() {
  const t = useTranslations('legal.copyright');
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
        <p className="text-lg text-foreground/60 font-light">
          {commonT('lastUpdated')}
        </p>
      </header>
      
      {/* 1. UGC License */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('ugc_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-6">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
             {t('ugc_intro')} <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">{t('ugc_license_name')}</a>.
          </p>
          <div className="space-y-4 pt-4">
             <p className="text-lg font-medium text-foreground">{t('ugc_freedom_intro')}</p>
             <ul className="list-disc pl-5 space-y-2 text-lg leading-relaxed text-foreground/80 font-light">
                <li><strong className="font-medium text-foreground">{t('ugc_share_title')}</strong> {t('ugc_share_body')}</li>
                <li><strong className="font-medium text-foreground">{t('ugc_adapt_title')}</strong> {t('ugc_adapt_body')}</li>
             </ul>
          </div>
           <div className="space-y-4 pt-4">
             <p className="text-lg font-medium text-foreground">{t('ugc_terms_intro')}</p>
             <ul className="list-disc pl-5 space-y-2 text-lg leading-relaxed text-foreground/80 font-light">
                <li><strong className="font-medium text-foreground">{t('ugc_attribution_title')}</strong> {t('ugc_attribution_body')}</li>
                <li><strong className="font-medium text-foreground">{t('ugc_sharealike_title')}</strong> {t('ugc_sharealike_body')}</li>
             </ul>
          </div>
        </div>
      </div>

       {/* 2. DMCA */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('dmca_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-8">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('dmca_intro')}
          </p>
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
             {t('dmca_instruction')}
          </p>
          
          <div className="pt-6">
              <h3 className="text-lg font-medium text-foreground mb-4">{t('dmca_req_title')}</h3>
               <p className="text-lg leading-relaxed text-foreground/80 font-light mb-4">
                  {t('dmca_req_intro')}
               </p>
               <ol className="list-decimal pl-5 space-y-4 text-lg leading-relaxed text-foreground/80 font-light">
                <li>{t('dmca_req_1')}</li>
                <li>{t('dmca_req_2')}</li>
                <li>{t('dmca_req_3')}</li>
                <li>{t('dmca_req_4')}</li>
                <li>{t('dmca_req_5')}</li>
                <li>{t('dmca_req_6')}</li>
              </ol>
          </div>
        </div>
      </div>
      
      {/* 3. Third Party */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
        <div className="md:col-span-4">
          <h2 className="text-xl font-medium">{t('thirdparty_title')}</h2>
        </div>
        <div className="md:col-span-8 space-y-6">
          <p className="text-lg leading-relaxed text-foreground/80 font-light">
            {t('thirdparty_body')}
          </p>
        </div>
      </div>

    </div>
  );
}
