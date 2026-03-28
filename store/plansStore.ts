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
  selectPlan: (selected: SelectedPlan) => void;
  clearSelection: () => void;
  completePurchase: (totalUsd: number) => Purchase | null;
}

export const usePlansStore = create<PlansState>((set, get) => ({
  selected: null,
  purchases: [],

  selectPlan: (selected) => set({ selected }),
  clearSelection: () => set({ selected: null }),

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
    }));

    return purchase;
  },
}));
