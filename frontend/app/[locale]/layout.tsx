import { AuthProvider } from '@/components/auth/auth-provider';
import { SessionManager } from '@/components/auth/session-manager';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { MobileNavbar } from '@/components/layout/mobile-navbar';
import { Navbar } from '@/components/layout/navbar';
import { ToolProvider } from '@/components/providers/tool-provider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import '../globals.css';

// Initialize PostHog analytics (client-side only)
if (typeof window !== 'undefined') {
  import('../../instrumentation');
}

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://daadaar.org'),
  title: {
    template: '%s | Daadaar',
    default: 'Daadaar Platform',
  },
  description: 'Decentralized, anonymous platform for exposing Iranian government injustices',
  openGraph: {
    title: 'Daadaar Platform',
    description: 'Decentralized, anonymous platform for exposing Iranian government injustices',
    url: '/',
    siteName: 'Daadaar',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daadaar Platform',
    description: 'Decentralized, anonymous platform for exposing Iranian government injustices',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
      },
    ],
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

import { Inter, Vazirmatn } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-vazirmatn',
});

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
        className={`${locale === 'fa' ? vazirmatn.className : inter.className} ${inter.variable} ${vazirmatn.variable} bg-background text-foreground antialiased min-h-screen selection:bg-accent-primary/30`}
      >
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <ToolProvider>
              <MobileNavbar />
              <Navbar />
              <LanguageToggle />
              <SessionManager />
              <main className="pt-0">{children}</main>
            </ToolProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
