import type { ViewContext } from '@/components/graph/config';
import GraphCanvas from '@/components/graph/graph-canvas';
import { fetchApi } from '@/lib/api';
import type { Metadata } from 'next';
import type { Individual } from '@/shared/types';

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

// Check if a string is a valid UUID
function isUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

async function resolveOrganizationUuid(uuid: string): Promise<number | undefined> {
  try {
    const response = await fetchApi<{ id: number }>(`/share/org/${uuid}`);
    return response.success && response.data ? response.data.id : undefined;
  } catch {
    return undefined;
  }
}

async function resolveIndividualUuid(uuid: string): Promise<number | undefined> {
  try {
    const response = await fetchApi<{ id: number }>(`/share/individual/${uuid}`);
    return response.success && response.data ? response.data.id : undefined;
  } catch {
    return undefined;
  }
}

async function getInitialView(searchParams: HomePageProps['searchParams']): Promise<ViewContext> {
  const view = getParamValue(searchParams?.view);

  if (view === 'people') {
    // Try UUID first, fall back to numeric ID
    const organizationUuid = getParamValue(searchParams?.organizationUuid);
    if (organizationUuid && isUuid(organizationUuid)) {
      const organizationId = await resolveOrganizationUuid(organizationUuid);
      if (organizationId) {
        return {
          mode: 'people',
          organizationId,
        };
      }
    }

    // Backward compatibility: support numeric organizationId
    const organizationId = parseNumberParam(searchParams?.organizationId);
    if (organizationId) {
      return {
        mode: 'people',
        organizationId,
      };
    }
  }

  if (view === 'reports') {
    // Try UUID first, fall back to numeric ID
    const individualUuid = getParamValue(searchParams?.individualUuid);
    if (individualUuid && isUuid(individualUuid)) {
      const individualId = await resolveIndividualUuid(individualUuid);
      if (individualId) {
        return {
          mode: 'reports',
          individualId,
        };
      }
    }

    // Backward compatibility: support numeric individualId
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

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const individualUuid = getParamValue(resolvedParams?.individualUuid);

  if (individualUuid && isUuid(individualUuid)) {
    const individualId = await resolveIndividualUuid(individualUuid);
    if (individualId) {
      const response = await fetchApi<Individual>(`/individuals/${individualId}`);
      if (response.success && response.data) {
        const individual = response.data;
        const displayName = individual.fullNameEn || individual.fullName;
        const description = individual.biographyEn || individual.biography || 'Public Servant Profile';
        // Note: Using the SEO image URL format
        const seoImageUrl = `https://daadaar-media-v1-317430950654.s3.amazonaws.com/seo/individual/${individualUuid}.jpg`;

        return {
          title: `Daadaar - ${displayName}`,
          description: description,
          openGraph: {
            title: `Daadaar - ${displayName}`,
            description: description,
            images: [
              {
                url: seoImageUrl,
                width: 1200,
                height: 630,
                alt: displayName,
              },
            ],
            type: 'profile',
          },
          twitter: {
            card: 'summary_large_image',
            title: `Daadaar - ${displayName}`,
            description: description,
            images: [seoImageUrl],
          },
        };
      }
    }
  }

  return {};
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = await searchParams;
  const initialView = await getInitialView(resolvedParams);

  return (
    <main className="absolute inset-0 w-full h-full overflow-hidden">
      <GraphCanvas initialView={initialView} />
    </main>
  );
}
