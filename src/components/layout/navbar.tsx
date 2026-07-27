"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Plane, Phone, Search, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  NavMega,
  DestinationsPanel,
  CustomizedPanel,
  TrendingPanel,
} from "./mega-menu";

const MORE_LINKS: [string, string][] = [
  ["For Agencies", "/agencies"],
  ["How it works", "/#how"],
  ["Curated Trips", "/#showcase"],
  ["About", "/about"],
];

const MOBILE_LINKS: [string, string][] = [
  ["Destinations", "/#destinations"],
  ["Customized", "/plan"],
  ["Trending", "/#showcase"],
  ["For Agencies", "/agencies"],
  ["How it works", "/#how"],
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      {/* thin accent line, like the reference */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-secondary" />

      <div
        className={cn(
          "bg-white transition-shadow",
          scrolled ? "shadow-md" : "shadow-sm",
        )}
      >
        <nav className="container flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow transition-transform group-hover:rotate-12">
              <Plane className="h-5 w-5" />
            </span>
            <span className="text-xl font-display font-bold tracking-tight text-slate-900">
              Trip<span className="text-gradient">Slab</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 lg:flex">
            <NavMega label="Group Trips" panel={<DestinationsPanel />} />
            <NavMega label="Customized" panel={<CustomizedPanel />} />
            <Link
              href="/plan"
              className="py-2 text-[15px] font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Bucket List Sale
            </Link>
            <NavMega label="Trending" panel={<TrendingPanel />} />
            <Link
              href="/agencies"
              className="py-2 text-[15px] font-medium text-slate-700 hover:text-primary"
            >
              Corporate
            </Link>
            <MoreDropdown />
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-3">
            <a
              href="tel:+919797972175"
              className="hidden items-center gap-2 xl:flex"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-primary">
                <Phone className="h-4 w-4" />
              </span>
              <span className="leading-tight">
                <span className="block text-[11px] text-slate-400">Call Us</span>
                <span className="block text-sm font-semibold text-slate-800">
                  +91 97 97 97 21 75
                </span>
              </span>
            </a>


            <Button asChild variant="gradient" size="sm" className="hidden md:inline-flex">
              <Link href="/plan">Plan a Trip</Link>
            </Button>

            <button
              className="text-slate-800 lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100 lg:hidden"
            >
              <div className="container flex flex-col gap-4 py-4">
                {MOBILE_LINKS.map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="text-sm font-medium text-slate-700"
                  >
                    {label}
                  </Link>
                ))}
                <Button asChild variant="gradient" size="sm">
                  <Link href="/plan">Plan a Trip</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}

function MoreDropdown() {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        if (timer.current) clearTimeout(timer.current);
        setOpen(true);
      }}
      onMouseLeave={() => {
        timer.current = setTimeout(() => setOpen(false), 120);
      }}
    >
      <button
        className={cn(
          "flex items-center gap-1 py-2 text-[15px] font-medium text-slate-700 hover:text-primary",
          open && "text-primary",
        )}
      >
        More
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl"
          >
            {MORE_LINKS.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary"
              >
                {label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
