import type { NormalizedPlan } from "../types/plans";

/** Most plans per country, capped — same ranking as Popular Destinations. */
export function getTopPlanCountries(
  plans: NormalizedPlan[],
  limit: number
): { iso2: string; name: string; plansCount: number }[] {
  const map = new Map<string, { name: string; planIds: Set<number> }>();
  for (const plan of plans) {
    for (const country of plan.countries) {
      const iso2 = (country.iso2 ?? "").trim().toUpperCase();
      if (!iso2) continue;
      const name = (country.country_name ?? "").trim();
      const existing = map.get(iso2);
      if (existing) {
        existing.planIds.add(plan.id);
      } else {
        map.set(iso2, { name, planIds: new Set([plan.id]) });
      }
    }
  }

  return Array.from(map.entries())
    .map(([iso2, value]) => ({
      iso2,
      name: value.name || iso2,
      plansCount: value.planIds.size,
    }))
    .sort((a, b) => b.plansCount - a.plansCount)
    .slice(0, limit);
}
