import GraphCanvas from '@/components/graph/graph-canvas';
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('navigation');

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Main Graph Canvas - Full Screen */}
      <main className="flex-1 relative overflow-hidden">
        <GraphCanvas />
      </main>
    </div>
  );
}
