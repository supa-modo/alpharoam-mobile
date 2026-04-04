import { fetchPlans } from "../services/plans";

/** Shared React Query key/options for catalog plans (keep in sync across screens). */
export const PLANS_QUERY_KEY = ["alpharoam", "plans"] as const;

export const PLANS_STALE_MS = 1000 * 60 * 10;

/** Background refresh while the app is open (stale-while-revalidate). */
export const PLANS_REFETCH_INTERVAL_MS = 1000 * 60 * 120;

/** Keep resolved catalog in memory across navigations. */
export const PLANS_GC_MS = 1000 * 60 * 60 * 24;

export const plansCatalogQueryOptions = {
  queryKey: PLANS_QUERY_KEY,
  queryFn: fetchPlans,
  staleTime: PLANS_STALE_MS,
  gcTime: PLANS_GC_MS,
  refetchInterval: PLANS_REFETCH_INTERVAL_MS,
  refetchIntervalInBackground: false,
} as const;
