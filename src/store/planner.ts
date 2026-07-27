import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TripType } from "@/lib/destinations";

export interface PlannerState {
  step: number; // 0 = personal, 1 = trip, 2 = confirm
  // Step 1 — personal details
  name: string;
  email: string;
  mobile: string;
  // Step 2 — trip details
  destination: string;
  departureCity: string;
  travelers: number;
  budget: number; // total budget in INR
  travelDate: string; // ISO date
  tripType: TripType | "";
  preferences: string;
  // set from the hero search form
  set: (patch: Partial<PlannerState>) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
}

const initial = {
  step: 0,
  name: "",
  email: "",
  mobile: "",
  destination: "",
  departureCity: "",
  travelers: 2,
  budget: 25000,
  travelDate: "",
  tripType: "" as TripType | "",
  preferences: "",
};

export const usePlanner = create<PlannerState>()(
  persist(
    (set, get) => ({
      ...initial,
      set: (patch) => set(patch),
      next: () => set({ step: Math.min(get().step + 1, 2) }),
      back: () => set({ step: Math.max(get().step - 1, 0) }),
      reset: () => set({ ...initial }),
    }),
    {
      name: "tripslab-planner",
      // Don't persist the wizard step — always resume fresh at the top.
      partialize: ({ step, set, next, back, reset, ...rest }) => rest,
    },
  ),
);

/** Per-traveler budget, used for slab assignment. */
export function perTravelerBudget(s: Pick<PlannerState, "budget" | "travelers">) {
  return s.travelers > 0 ? Math.round(s.budget / s.travelers) : s.budget;
}
