"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Users,
  CalendarDays,
  Wallet,
  Lock,
  BadgeCheck,
  Clock,
  Phone,
  Mail,
  User,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type { MarketplaceLead } from "@/lib/masking";
import { ScoreRing } from "./score-ring";
import { formatINR } from "@/lib/utils";
import { useAgency, type Purchase } from "@/store/agency";

export function LeadCard({
  lead,
  onBuy,
}: {
  lead: MarketplaceLead;
  onBuy: (lead: MarketplaceLead) => void;
}) {
  const purchase = useAgency((s) =>
    s.purchases.find((p) => p.leadId === lead.id),
  );
  // Non-exclusive: "owned" means THIS agency unlocked it (locally or per the
  // server). Leads other agencies bought stay fully unlockable.
  const owned = Boolean(purchase) || lead.owned;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-lg font-bold text-slate-900">
            <MapPin className="h-4 w-4 text-indigo-500" />
            {lead.destination}
          </div>
          <div className="mt-0.5 font-mono text-xs text-slate-400">
            {lead.reference}
          </div>
        </div>
        <ScoreRing score={lead.leadScore} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Meta icon={<Wallet className="h-4 w-4" />} label="Budget">
          {lead.budgetRange}
        </Meta>
        <Meta icon={<CalendarDays className="h-4 w-4" />} label="Travel">
          {lead.travelMonth}
        </Meta>
        <Meta icon={<Users className="h-4 w-4" />} label="Group">
          {lead.travelers} traveler{lead.travelers > 1 ? "s" : ""}
        </Meta>
        <Meta icon={<Clock className="h-4 w-4" />} label="Posted">
          {lead.postedAgoHours < 1 ? "just now" : `${lead.postedAgoHours}h ago`}
        </Meta>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {lead.otpVerified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <BadgeCheck className="h-3.5 w-3.5" /> OTP verified
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" /> Score {lead.leadScore}
        </span>
      </div>

      {owned && purchase ? (
        <RevealedBlock purchase={purchase} />
      ) : (
        <MaskedBlock />
      )}

      <div className="mt-auto pt-4">
        {owned ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Purchased
          </div>
        ) : (
          <button
            onClick={() => onBuy(lead)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <Lock className="h-4 w-4" />
            Unlock lead · {formatINR(lead.price)}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function Meta({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5">
      <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 font-semibold text-slate-800">{children}</div>
    </div>
  );
}

/** Blurred placeholder for gated PII. */
function MaskedBlock() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Lock className="h-3.5 w-3.5" />
        Contact hidden until purchase
      </div>
      <div className="mt-2 space-y-1.5">
        {[User, Phone, Mail].map((Icon, i) => (
          <div key={i} className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-slate-300" />
            <span className="h-3 w-32 rounded bg-slate-200 blur-[3px] select-none">
              ••••••••••
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevealedBlock({ purchase }: { purchase: Purchase }) {
  const c = purchase.contact;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-4 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/70 p-3"
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
        <BadgeCheck className="h-3.5 w-3.5" /> Contact unlocked
      </div>
      <div className="mt-2 space-y-1.5 text-sm">
        <Row icon={<User className="h-3.5 w-3.5" />}>{c.name}</Row>
        <Row icon={<Phone className="h-3.5 w-3.5" />}>
          <a href={`tel:${c.mobile}`} className="text-indigo-600">
            {c.mobile}
          </a>
        </Row>
        <Row icon={<Mail className="h-3.5 w-3.5" />}>
          <a href={`mailto:${c.email}`} className="text-indigo-600">
            {c.email}
          </a>
        </Row>
        <Row icon={<MapPin className="h-3.5 w-3.5" />}>
          From {c.departureCity} · {c.travelDate}
        </Row>
      </div>
      <p className="mt-2 rounded-lg bg-white/70 p-2 text-xs text-slate-600">
        {c.preferences}
      </p>
    </motion.div>
  );
}

function Row({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-slate-700">
      <span className="text-emerald-600">{icon}</span>
      {children}
    </div>
  );
}
