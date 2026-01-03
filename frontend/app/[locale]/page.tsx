import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('common');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">{t('welcome')}</h1>
        <p className="text-lg">Daadaar Platform</p>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Built with Next.js 16, React 19, Tailwind CSS v4, Biome, and Bun
        </p>
      </div>
    </main>
  );
}
