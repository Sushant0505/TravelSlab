import Link from "next/link";
import { Activity, Building2, Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { listTravelerTrips } from "@/server/traveler-repo";
import { PageTitle, DashCard, EmptyState, relativeTime } from "@/components/dashboard/ui";

export const metadata = { title: "Lead Activity" };

interface Event {
  destination: string;
  reference: string;
  atISO: string;
}

export default async function LeadActivityPage() {
  const session = await getSession();
  if (!session) return null;
  const trips = await listTravelerTrips(session.id);

  // Flatten every agency unlock across all trips into a single timeline.
  // Agencies stay anonymous until they actually contact the traveler.
  const events: Event[] = trips
    .flatMap((t) =>
      t.unlockedBy.map((u) => ({
        destination: t.destination,
        reference: t.reference,
        atISO: u.atISO,
      })),
    )
    .sort((a, b) => +new Date(b.atISO) - +new Date(a.atISO));

  return (
    <div>
      <PageTitle
        title="Lead Activity"
        subtitle="When a verified agency unlocks your trip to send a quote, it shows up here."
      />

      {events.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-6 w-6" />}
          title="No activity yet"
          hint="As soon as an agency picks up one of your trips, you'll see it here."
          action={
            <Link href="/dashboard/trips" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
              View my trips
            </Link>
          }
        />
      ) : (
        <DashCard className="divide-y divide-slate-100">
          {events.map((e, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800">
                  <span className="font-semibold">A verified agency</span> unlocked
                  your <span className="font-semibold">{e.destination}</span> trip
                </p>
                <p className="text-xs text-slate-400">
                  {e.reference} · they may reach out with a quote soon
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{relativeTime(e.atISO)}</span>
            </div>
          ))}
        </DashCard>
      )}
    </div>
  );
}
