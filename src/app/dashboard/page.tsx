import Link from "next/link";
import { Plus, Luggage, Building2, Activity, Bell, ArrowRight, MapPin } from "lucide-react";
import { getSession } from "@/lib/auth";
import { listTravelerTrips } from "@/server/traveler-repo";
import { countApprovedAgencies } from "@/server/admin-repo";
import { unreadTraveler } from "@/server/notify-repo";
import { DashCard, EmptyState, formatDate } from "@/components/dashboard/ui";
import { AgenciesWaiting } from "@/components/dashboard/agencies-waiting";
import { formatINR } from "@/lib/utils";

export default async function DashboardOverview() {
  const session = await getSession();
  if (!session) return null;

  const [trips, unread, approvedAgencies] = await Promise.all([
    listTravelerTrips(session.id),
    unreadTraveler(session.id),
    countApprovedAgencies(),
  ]);

  const totalUnlocks = trips.reduce((s, t) => s + t.unlocks, 0);
  const activeLeads = trips.filter(
    (t) => t.status === "AVAILABLE" || t.status === "VERIFIED" || t.status === "NEW",
  ).length;
  const firstName = session.name.trim().split(/\s+/)[0] || "traveler";

  const stats = [
    { icon: Luggage, label: "Trips submitted", value: String(trips.length), tone: "text-primary bg-primary/10" },
    { icon: Activity, label: "Active leads", value: String(activeLeads), tone: "text-sky-600 bg-sky-50" },
    { icon: Building2, label: "Agencies interested", value: String(totalUnlocks), tone: "text-emerald-600 bg-emerald-50" },
    { icon: Bell, label: "Unread alerts", value: String(unread), tone: "text-rose-600 bg-rose-50" },
  ];

  return (
    <div>
      {/* Greeting / CTA banner */}
      <DashCard className="mb-6 overflow-hidden border-0 bg-gradient-to-r from-primary via-accent to-secondary">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 text-white">
          <div>
            <h1 className="font-display text-2xl font-bold">Hi {firstName} 👋</h1>
            <p className="mt-1 text-sm text-white/85">
              Here&apos;s what&apos;s happening with your trips.
            </p>
          </div>
          <Link
            href="/plan"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition-transform hover:scale-105"
          >
            <Plus className="h-4 w-4" /> Plan a new trip
          </Link>
        </div>
      </DashCard>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <DashCard key={s.label} className="p-4">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${s.tone}`}>
              <s.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </DashCard>
        ))}
      </div>

      {/* Recent trips */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Recent trips</h2>
        {trips.length > 0 && (
          <Link href="/dashboard/trips" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {trips.length === 0 ? (
        <EmptyState
          icon={<Luggage className="h-6 w-6" />}
          title="No trips yet"
          hint="Plan your first trip and verified agencies will send you quotes."
          action={
            <Link href="/plan" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" /> Plan a trip
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {trips.slice(0, 4).map((t) => (
            <DashCard key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-slate-900">{t.destination}</span>
                  <span className="font-mono text-xs text-slate-400">{t.reference}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {t.travelers} traveler(s) · {formatDate(t.travelDateISO)} · {formatINR(t.budget)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-slate-500 sm:inline">
                  {t.unlocks} {t.unlocks === 1 ? "agency" : "agencies"} interested
                </span>
                <AgenciesWaiting waiting={approvedAgencies - t.unlocks} />
              </div>
            </DashCard>
          ))}
        </div>
      )}
    </div>
  );
}
