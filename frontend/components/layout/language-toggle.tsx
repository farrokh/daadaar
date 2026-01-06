'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

export function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
      <div
        className={cn(
          'flex items-center p-1 rounded-full',
          'bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg',
          'liquid-glass'
        )}
      >
        <button
          type="button"
          onClick={() => router.replace(pathname, { locale: 'en' })}
          className={cn(
            'relative px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300',
            locale === 'en'
              ? 'bg-white dark:bg-white/10 text-foreground shadow-sm scale-105'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
          )}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => router.replace(pathname, { locale: 'fa' })}
          className={cn(
            'relative px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 font-[family-name:var(--font-vazirmatn)]',
            locale === 'fa'
              ? 'bg-white dark:bg-white/10 text-foreground shadow-sm scale-105'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
          )}
        >
          فارسی
        </button>
      </div>
    </div>
  );
}
