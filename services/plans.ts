import axios from "axios";
import type {
  AlphaRoamPlansResponse,
  AlphaRoamPlan,
  AlphaRoamCountry,
  NormalizedPlan,
} from "../types/plans";

const PLANS_URL = "https://kleptica.co.ke/project/alpharoam/all.json";
const PLANS_SOURCE = process.env.EXPO_PUBLIC_PLANS_SOURCE ?? "local";

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeCountries(value: AlphaRoamPlan["countires"]): AlphaRoamCountry[] {
  if (!value) return [];
  return value.filter(Boolean);
}

export function normalizePlan(plan: AlphaRoamPlan): NormalizedPlan {
  const region = (plan.region ?? "").trim() || "Region";
  const name = (plan.name ?? "").trim() || `Plan #${plan.id}`;

  const dataGb = toNumber(plan.data);
  const validityDays = toNumber(plan.validity);
  const priceUsd = toNumber(plan.price);
  const planType = (plan.planType ?? "").trim() || "E-SIM";
  const detailsText = plan.details ? stripHtml(plan.details) : "";

  return {
    id: plan.id,
    name,
    region,
    dataGb,
    validityDays,
    planType,
    priceUsd,
    detailsText,
    countries: normalizeCountries(plan.countires),
  };
}

function loadLocalPlansJson(): AlphaRoamPlansResponse {
  // Use `require` so we don't depend on TS `resolveJsonModule`.
  // Metro will bundle the JSON for the app.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("../store/plans.json") as AlphaRoamPlansResponse;
}

export async function fetchPlansRemote(): Promise<NormalizedPlan[]> {
  const { data } = await axios.get<AlphaRoamPlansResponse>(PLANS_URL, {
    timeout: 60000,
  });
  const plans = Array.isArray(data?.data) ? data.data : [];
  return plans.map(normalizePlan);
}

export async function fetchPlansLocal(): Promise<NormalizedPlan[]> {
  const data = loadLocalPlansJson();
  const plans = Array.isArray(data?.data) ? data.data : [];
  return plans.map(normalizePlan);
}

export async function fetchPlans(): Promise<NormalizedPlan[]> {
  if (PLANS_SOURCE === "remote") return fetchPlansRemote();
  return fetchPlansLocal();
}
