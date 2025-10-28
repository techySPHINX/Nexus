import localforage from 'localforage';
import type {
  PaginatedProjectsInterface,
  ProjectPaginationResponse,
} from '@/types/ShowcaseType';

const STORE_NAME = 'nexus-showcase-cache';
const lf = localforage.createInstance({ name: STORE_NAME });

export const KEYS = {
  PROJECTS_INDEX_PREFIX: 'showcase:allProjects:page:',
  SUPPORTED: 'showcase:supportedProjects:v1',
  FOLLOWED: 'showcase:followedProjects:v1',
  MYPROJECTS: 'showcase:myProjects:v1',
};

// Save a page of index items (small objects) under a page key
export async function saveProjectsIndexPage(
  pageKey: string,
  page: PaginatedProjectsInterface
) {
  try {
    await lf.setItem<PaginatedProjectsInterface & { lastFetched: number }>(
      KEYS.PROJECTS_INDEX_PREFIX + pageKey,
      {
        data: page.data,
        pagination: page.pagination,
        lastFetched: Date.now(),
      }
    );
  } catch (e) {
    // swallow errors; persistence is best-effort
    console.error('saveProjectsIndexPage error', e);
  }
}

export async function restoreProjectsIndexPage(
  pageKey: string
): Promise<PaginatedProjectsInterface | null> {
  try {
    const r = await lf.getItem<
      PaginatedProjectsInterface & { lastFetched: number }
    >(KEYS.PROJECTS_INDEX_PREFIX + pageKey);
    if (!r) return null;
    return {
      data: r.data || [],
      pagination:
        (r.pagination as ProjectPaginationResponse) ||
        ({
          nextCursor: undefined,
          hasNext: false,
        } as ProjectPaginationResponse),
    };
  } catch (e) {
    console.error('restoreProjectsIndexPage error', e);
    return null;
  }
}

export async function saveSmallList(
  key: string,
  page: PaginatedProjectsInterface
) {
  try {
    await lf.setItem<PaginatedProjectsInterface & { lastFetched: number }>(
      key,
      {
        data: page.data,
        pagination: page.pagination,
        lastFetched: Date.now(),
      }
    );
  } catch (e) {
    console.error('saveSmallList error', e);
  }
}

export async function restoreSmallList(
  key: string
): Promise<PaginatedProjectsInterface | null> {
  try {
    const r = await lf.getItem<
      PaginatedProjectsInterface & { lastFetched: number }
    >(key);
    if (!r) return null;
    return {
      data: r.data || [],
      pagination:
        (r.pagination as ProjectPaginationResponse) ||
        ({
          nextCursor: undefined,
          hasNext: false,
        } as ProjectPaginationResponse),
    };
  } catch (e) {
    console.error('restoreSmallList error', e);
    return null;
  }
}

export default lf;

// Clear all persisted showcase cache for this localforage instance.
// This is useful to call on logout or session expiry so persisted
// project/index data doesn't remain on disk tied to a user session.
export async function clearAllShowcaseCache() {
  try {
    await lf.clear();
  } catch (e) {
    // best-effort; log and continue
    console.error('clearAllShowcaseCache error', e);
  }
}
