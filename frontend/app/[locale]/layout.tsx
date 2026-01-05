import { AuthProvider } from '@/components/auth/auth-provider';
import { SessionManager } from '@/components/auth/session-manager';
import { Navbar } from '@/components/layout/navbar';
import { ToolProvider } from '@/components/providers/tool-provider';
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

import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

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
      <body
        suppressHydrationWarning
        className={`${inter.className} bg-background text-foreground antialiased min-h-screen selection:bg-accent-primary/30`}
      >
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <ToolProvider>
              <Navbar />
              <SessionManager />
              <main className="pt-0">{children}</main>
            </ToolProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
