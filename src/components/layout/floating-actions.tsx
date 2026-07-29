"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowUp } from "lucide-react";
import { useWelcome } from "@/store/welcome";

/** WhatsApp business number (digits only, country code first). */
const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919797972175";
const WHATSAPP_MSG =
  "Hi TripSlab! I'd like help planning a trip. Can you assist?";

/** Official WhatsApp glyph (lucide has no brand icons). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.943c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.652a11.882 11.882 0 005.71 1.454h.005c6.582 0 11.943-5.359 11.945-11.945a11.876 11.876 0 00-3.48-8.408Z" />
    </svg>
  );
}

/**
 * Floating action cluster (bottom-right): WhatsApp chat + a "Plan a trip"
 * button that re-opens the welcome popup, plus a back-to-top pill on scroll.
 * Hidden on the agency/admin dashboards.
 */
export function FloatingActions() {
  const pathname = usePathname();
  const setWelcome = useWelcome((s) => s.setOpen);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep it off the B2B panels.
  if (pathname.startsWith("/agencies") || pathname.startsWith("/admin")) {
    return null;
  }

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_MSG,
  )}`;

  return (
    <div className="fixed bottom-5 right-4 z-[90] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {/* Back to top — only after scrolling down */}
      <AnimatePresence>
        {scrolled && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card/90 text-foreground shadow-lg backdrop-blur transition-colors hover:bg-muted"
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Plan a trip — re-opens the welcome popup */}
      <FabButton
        label="Plan a trip"
        onClick={() => setWelcome(true)}
        className="bg-gradient-to-br from-primary to-accent text-white"
        delay={0.15}
        pulse
      >
        <Sparkles className="h-6 w-6" />
      </FabButton>

      {/* WhatsApp chat */}
      <FabButton
        label="Chat on WhatsApp"
        href={waHref}
        className="bg-[#25D366] text-white"
        delay={0}
        pulse
      >
        <WhatsAppIcon className="h-7 w-7" />
      </FabButton>
    </div>
  );
}

function FabButton({
  children,
  label,
  href,
  onClick,
  className,
  delay = 0,
  pulse = false,
}: {
  children: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  delay?: number;
  pulse?: boolean;
}) {
  const inner = (
    <>
      {/* Hover label (desktop) */}
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 sm:block">
        {label}
      </span>
      {pulse && (
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-current opacity-30" />
      )}
      {children}
    </>
  );

  const base =
    "group relative grid h-14 w-14 place-items-center rounded-full shadow-xl transition-transform hover:scale-110 active:scale-95";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay }}
    >
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={`${base} ${className}`}
        >
          {inner}
        </a>
      ) : (
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className={`${base} ${className}`}
        >
          {inner}
        </button>
      )}
    </motion.div>
  );
}
