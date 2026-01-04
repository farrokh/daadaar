import GraphCanvas from '@/components/graph/graph-canvas';

export default async function HomePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Main Graph Canvas - Full Screen */}
      <main className="flex-1 relative overflow-hidden">
        <GraphCanvas />
      </main>
    </div>
  );
}
