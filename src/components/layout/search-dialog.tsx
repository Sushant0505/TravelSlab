"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, MapPin, Package as PackageIcon, Compass, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { SearchResults } from "@/app/api/search/route";

const EMPTY: SearchResults = { destinations: [], packages: [], themes: [] };

/** Search button for the navbar that opens a global search command palette. */
export function SearchTrigger({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !isTyping())) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className={
          className ??
          "grid h-9 w-9 place-items-center rounded-full text-slate-700 hover:bg-slate-100 hover:text-primary"
        }
      >
        <Search className="h-5 w-5" />
      </button>
      <AnimatePresence>{open && <SearchOverlay onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function isTyping() {
  const el = document.activeElement;
  return el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        setResults(await r.json());
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const hasResults =
    results.destinations.length + results.packages.length + results.themes.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[130] flex items-start justify-center bg-slate-900/50 p-4 pt-[10vh] backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search destinations, packages, themes…"
            className="flex-1 bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {q.trim().length < 2 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-400">
              Type at least 2 characters. Try “Goa”, “beach”, or “backpacking”.
            </p>
          ) : !hasResults && !loading ? (
            <p className="px-3 py-8 text-center text-sm text-slate-400">No matches for “{q}”.</p>
          ) : (
            <>
              {results.destinations.length > 0 && (
                <Group title="Destinations">
                  {results.destinations.map((d) => (
                    <Row key={d.slug} href={`/destinations/${d.slug}`} onClose={onClose} image={d.image} icon={<MapPin className="h-4 w-4" />} title={d.name} sub={d.region} />
                  ))}
                </Group>
              )}
              {results.packages.length > 0 && (
                <Group title="Packages">
                  {results.packages.map((p) => (
                    <Row
                      key={p.slug}
                      href={`/trips/${p.slug}`}
                      onClose={onClose}
                      image={p.image}
                      icon={<PackageIcon className="h-4 w-4" />}
                      title={p.name}
                      sub={`${p.destinationName} · from ${formatINR(p.price)}`}
                    />
                  ))}
                </Group>
              )}
              {results.themes.length > 0 && (
                <Group title="Themes">
                  {results.themes.map((t) => (
                    <Row key={t.label} href={t.href} onClose={onClose} icon={<Compass className="h-4 w-4" />} title={t.label} />
                  ))}
                </Group>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</div>
      {children}
    </div>
  );
}

function Row({
  href,
  onClose,
  image,
  icon,
  title,
  sub,
}: {
  href: string;
  onClose: () => void;
  image?: string;
  icon: React.ReactNode;
  title: string;
  sub?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50"
    >
      {image ? (
        <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-full w-full object-cover" />
        </span>
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">{icon}</span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-slate-800">{title}</span>
        {sub && <span className="block truncate text-xs text-slate-400">{sub}</span>}
      </span>
    </Link>
  );
}
