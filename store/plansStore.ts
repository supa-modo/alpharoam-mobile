import { create } from "zustand";
import type { NormalizedPlan } from "../types/plans";

type SelectedPlan = {
  plan: NormalizedPlan;
  countryIso2: string;
  countryName: string;
};

type Purchase = {
  id: string;
  planId: number;
  planName: string;
  countryName: string;
  totalUsd: number;
  createdAt: string;
};

interface PlansState {
  selected: SelectedPlan | null;
  purchases: Purchase[];
  activePlan: NormalizedPlan | null;
  activePlanExpiry: string | null;
  hasActivePlan: boolean;
  selectPlan: (selected: SelectedPlan) => void;
  clearSelection: () => void;
  setActivePlan: (plan: NormalizedPlan, expiryIso?: string | null) => void;
  clearActivePlan: () => void;
  completePurchase: (totalUsd: number) => Purchase | null;
}

export const usePlansStore = create<PlansState>((set, get) => ({
  selected: null,
  purchases: [],
  activePlan: null,
  activePlanExpiry: null,
  hasActivePlan: false,

  selectPlan: (selected) => set({ selected }),
  clearSelection: () => set({ selected: null }),
  setActivePlan: (plan, expiryIso = null) =>
    set({
      activePlan: plan,
      activePlanExpiry: expiryIso,
      hasActivePlan: true,
    }),
  clearActivePlan: () =>
    set({
      activePlan: null,
      activePlanExpiry: null,
      hasActivePlan: false,
    }),

  completePurchase: (totalUsd) => {
    const selected = get().selected;
    if (!selected) return null;

    const purchase: Purchase = {
      id: `purchase_${Date.now()}`,
      planId: selected.plan.id,
      planName: selected.plan.name,
      countryName: selected.countryName,
      totalUsd,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      purchases: [purchase, ...state.purchases],
      selected: null,
      activePlan: selected.plan,
      activePlanExpiry:
        selected.plan.validityDays !== null
          ? new Date(Date.now() + selected.plan.validityDays * 24 * 60 * 60 * 1000).toISOString()
          : null,
      hasActivePlan: true,
    }));

    return purchase;
  },
}));
