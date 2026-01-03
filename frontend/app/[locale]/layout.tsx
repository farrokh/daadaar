import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import { SessionManager } from '@/components/auth/session-manager';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const metadata = {
  title: 'Daadaar Platform',
  description: 'Decentralized, anonymous platform for exposing government injustices',
};

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
      <body>
        <NextIntlClientProvider messages={messages}>
          <SessionManager />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
