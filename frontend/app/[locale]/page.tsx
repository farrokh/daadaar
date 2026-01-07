import type { ViewContext } from '@/components/graph/config';
import GraphCanvas from '@/components/graph/graph-canvas';

type HomePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getParamValue(value?: string | string[]): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function parseNumberParam(value?: string | string[]): number | undefined {
  const normalized = getParamValue(value);
  if (!normalized) return undefined;

  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getInitialView(searchParams: HomePageProps['searchParams']): ViewContext {
  const view = getParamValue(searchParams?.view);

  if (view === 'people') {
    const organizationId = parseNumberParam(searchParams?.organizationId);
    if (organizationId) {
      return {
        mode: 'people',
        organizationId,
      };
    }
  }

  if (view === 'reports') {
    const individualId = parseNumberParam(searchParams?.individualId);
    if (individualId) {
      return {
        mode: 'reports',
        individualId,
      };
    }
  }

  return { mode: 'organizations' };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = await searchParams;
  const initialView = getInitialView(resolvedParams);

  return (
    <main className="absolute inset-0 w-full h-full overflow-hidden">
      <GraphCanvas initialView={initialView} />
    </main>
  );
}
