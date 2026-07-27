import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RevealedContact } from "@/lib/masking";
import type { SlabId } from "@/lib/slabs";

export interface Purchase {
  leadId: string;
  reference: string;
  invoiceNo: string;
  amount: number;
  destination: string;
  purchasedAtISO: string;
  contact: RevealedContact;
}

export interface AgencyFilters {
  slab?: SlabId | "";
  destination: string;
  minScore: number;
  hideSold: boolean;
  sort: "newest" | "score" | "priceLow" | "priceHigh";
}

interface AgencyState {
  // demo wallet
  walletBalance: number;
  filters: AgencyFilters;
  purchases: Purchase[];
  setFilter: (patch: Partial<AgencyFilters>) => void;
  resetFilters: () => void;
  addPurchase: (p: Purchase) => void;
  hasPurchased: (leadId: string) => boolean;
  spend: (amount: number) => void;
}

const defaultFilters: AgencyFilters = {
  slab: "",
  destination: "",
  minScore: 0,
  hideSold: true,
  sort: "newest",
};

export const useAgency = create<AgencyState>()(
  persist(
    (set, get) => ({
      walletBalance: 5000,
      filters: defaultFilters,
      purchases: [],
      setFilter: (patch) =>
        set({ filters: { ...get().filters, ...patch } }),
      resetFilters: () => set({ filters: defaultFilters }),
      addPurchase: (p) =>
        set({ purchases: [p, ...get().purchases.filter((x) => x.leadId !== p.leadId)] }),
      hasPurchased: (leadId) => get().purchases.some((p) => p.leadId === leadId),
      spend: (amount) =>
        set({ walletBalance: Math.max(0, get().walletBalance - amount) }),
    }),
    { name: "tripslab-agency" },
  ),
);
