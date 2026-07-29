"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterCities } from "@/lib/cities";

/**
 * Departure-city combobox: filters cities as you type ("de" -> Dehradun,
 * Delhi) and shows a dropdown, while still allowing any free-typed value.
 */
export function CityAutocomplete({
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => filterCities(value), [value]);
  const showList = open && matches.length > 0;

  // Close when clicking outside.
  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  function choose(city: string) {
    onChange(city);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && showList && active >= 0) {
      e.preventDefault();
      choose(matches[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground/80">
        {label}
      </span>
      <div ref={wrapRef} className="relative">
        <input
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring",
            error && "border-red-500 focus:ring-red-500",
          )}
        />

        <AnimatePresence>
          {showList && (
            <motion.ul
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
              className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-2xl border border-border bg-background p-1.5 shadow-xl"
            >
              {matches.map((city, i) => (
                <li key={city}>
                  <button
                    type="button"
                    // mousedown so selection wins over the input's blur
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(city);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      i === active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {highlight(city, value)}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </div>
  );
}

/** Bold the portion of the city name that matches the query. */
function highlight(city: string, query: string) {
  const q = query.trim();
  if (!q) return city;
  const idx = city.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return city;
  return (
    <span>
      {city.slice(0, idx)}
      <b className="font-bold text-primary">{city.slice(idx, idx + q.length)}</b>
      {city.slice(idx + q.length)}
    </span>
  );
}
