"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

const SESSION_KEY = "tripslab-offer-seen";

/** Limited-time offer modal. Fires once per browser session, after 6s. */
export function OfferPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const t = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 6000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-card p-8 text-center shadow-2xl"
          >
            {/* Decorative gradient blob */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-primary to-accent opacity-30 blur-2xl" />

            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-accent text-white shadow-lg"
            >
              <Gift className="h-8 w-8" />
            </motion.div>

            <h3 className="mt-5 font-display text-2xl font-bold">
              🔥 Special Travel Offer
            </h3>
            <p className="mt-2 text-muted-foreground">
              Plan your trip today and get <b>FREE expert trip planning</b> plus
              exclusive early-bird discounts from matched agencies.
            </p>

            <Button asChild variant="gradient" size="lg" className="mt-6 w-full">
              <Link href="/plan" onClick={() => setOpen(false)}>
                <Sparkles className="h-4 w-4" />
                Plan Trip Now
              </Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              No spam. Your details stay private until you choose an agency.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
