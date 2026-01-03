import GraphCanvas from '@/components/graph/graph-canvas';
import { Button } from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function HomePage() {
  const nav = await getTranslations('navigation');

  return (
    <div className="flex flex-col h-screen">
      {/* Header/Nav */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-20">
        <Link className="flex items-center justify-center" href="/">
          <span className="text-2xl font-bold tracking-tighter sm:text-3xl bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Daadaar
          </span>
        </Link>
        <nav className="mx-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/reports">
            {nav('reports')}
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/graph">
            {nav('graph')}
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/about">
            {nav('about')}
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              {nav('login')}
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">{nav('signup')}</Button>
          </Link>
        </div>
      </header>

      {/* Main Graph Canvas - Full Screen */}
      <main className="flex-1 relative overflow-hidden">
        <GraphCanvas />
      </main>
    </div>
  );
}
