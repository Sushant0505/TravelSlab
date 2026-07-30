import Link from "next/link";
import { Plus, Luggage, MapPin, Users, Wallet, CalendarClock } from "lucide-react";
import { getSession } from "@/lib/auth";
import { listTravelerTrips } from "@/server/traveler-repo";
import { countApprovedAgencies } from "@/server/admin-repo";
import { DashCard, PageTitle, EmptyState, formatDate } from "@/components/dashboard/ui";
import { TransportIcon } from "@/components/dashboard/transport-icon";
import { AgenciesWaiting } from "@/components/dashboard/agencies-waiting";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "My Trips" };

export default async function MyTripsPage() {
  const session = await getSession();
  if (!session) return null;
  const [trips, approvedAgencies] = await Promise.all([
    listTravelerTrips(session.id),
    countApprovedAgencies(),
  ]);

  return (
    <div>
      <PageTitle
        title="My Trips"
        subtitle="Every trip request you've submitted."
        action={
          <Link href="/plan" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105">
            <Plus className="h-4 w-4" /> New trip
          </Link>
        }
      />

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
        <div className="grid gap-4 sm:grid-cols-2">
          {trips.map((t, i) => (
            <DashCard key={t.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <TransportIcon className="h-5 w-5" offset={i} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{t.destination}</p>
                    <p className="font-mono text-[11px] text-slate-400">{t.reference}</p>
                  </div>
                </div>
                <AgenciesWaiting waiting={approvedAgencies - t.unlocks} />
              </div>

              <p className="mt-2 text-[11px] text-slate-400">
                Trusted agencies ready to plan your{" "}
                <span className="font-medium text-slate-500">{t.destination}</span> trip
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Detail icon={<MapPin className="h-4 w-4" />} label="From" value={t.departureCity} />
                <Detail icon={<CalendarClock className="h-4 w-4" />} label="Travel date" value={formatDate(t.travelDateISO)} />
                <Detail icon={<Users className="h-4 w-4" />} label="Travelers" value={String(t.travelers)} />
                <Detail icon={<Wallet className="h-4 w-4" />} label="Budget" value={formatINR(t.budget)} />
              </dl>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-500">
                  {t.unlocks > 0
                    ? `${t.unlocks} ${t.unlocks === 1 ? "agency has" : "agencies have"} shown interest`
                    : "Waiting for agencies"}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {t.slabLabel}
                </span>
              </div>
            </DashCard>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-slate-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-slate-800">{value}</dd>
    </div>
  );
}
