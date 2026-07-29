import { create } from "zustand";

/**
 * Tiny UI store for the "Plan Your Next Trip" welcome popup, so the floating
 * action button (and anything else) can re-open it from anywhere on the site.
 */
export const useWelcome = create<{
  open: boolean;
  setOpen: (v: boolean) => void;
}>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
