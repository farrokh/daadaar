import { SessionManager } from '@/components/auth/session-manager';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const metadata = {
  title: 'Daadaar Platform',
  description: 'Decentralized, anonymous platform for exposing government injustices',
};

/**
 * Root layout that sets the document language and direction, provides localization messages, and mounts session management for the specified locale.
 *
 * Awaits the route `locale` from `params`, triggers a 404 if the locale is not supported, loads translation messages, and returns an HTML structure with the locale applied (`dir` is set to `rtl` only for `fa`). The body suppresses hydration warnings and wraps `children` with the internationalization provider and a SessionManager.
 *
 * @param children - The React node(s) to render inside the layout
 * @param params - A promise resolving to an object with the route `locale` (e.g., `{ locale: 'en' }`)
 * @returns The root HTML layout element for the resolved locale
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'fa' ? 'rtl' : 'ltr'}>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <SessionManager />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}