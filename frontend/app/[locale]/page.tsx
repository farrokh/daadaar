import GraphCanvas from '@/components/graph/graph-canvas';

export default async function HomePage() {
  return (
    <main className="absolute inset-0 w-full h-full overflow-hidden">
      <GraphCanvas />
    </main>
  );
}
