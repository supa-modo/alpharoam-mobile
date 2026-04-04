import { File, Paths } from "expo-file-system";

import type { NormalizedPlan } from "../types/plans";

const CACHE_FILENAME = "alpharoam-plans-cache.json";

/** Keep on disk up to 48h; React Query staleTime controls how often we refetch. */
export const PLANS_DISK_CACHE_TTL_MS = 48 * 60 * 60 * 1000;

type CachePayload = {
  savedAt: number;
  plans: NormalizedPlan[];
};

function cacheFile(): File {
  return new File(Paths.document, CACHE_FILENAME);
}

export async function readValidCachedPlans(): Promise<NormalizedPlan[] | null> {
  try {
    const file = cacheFile();
    if (!file.exists) return null;
    const raw = await file.text();
    const parsed = JSON.parse(raw) as CachePayload;
    if (!parsed || typeof parsed.savedAt !== "number" || !Array.isArray(parsed.plans)) {
      return null;
    }
    if (Date.now() - parsed.savedAt > PLANS_DISK_CACHE_TTL_MS) {
      return null;
    }
    return parsed.plans;
  } catch {
    return null;
  }
}

export async function writePlansDiskCache(plans: NormalizedPlan[]): Promise<void> {
  const file = cacheFile();
  const payload: CachePayload = { savedAt: Date.now(), plans };
  const body = JSON.stringify(payload);
  if (!file.exists) {
    file.create({ intermediates: true });
  }
  file.write(body);
}
