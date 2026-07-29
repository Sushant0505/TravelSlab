"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Mail, Phone, Loader2, Check } from "lucide-react";
import { PageTitle, DashCard } from "@/components/dashboard/ui";
import { initialsOf } from "@/components/layout/user-menu";

interface Account {
  id: string;
  name: string;
  email: string;
  mobile: string;
}

export default function ProfilePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["traveler-profile"],
    queryFn: async (): Promise<{ account: Account }> =>
      (await fetch("/api/traveler/profile")).json(),
  });

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const account = data?.account;
  useEffect(() => {
    if (account) {
      setName(account.name);
      setMobile(account.mobile);
    }
  }, [account]);

  const save = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/traveler/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error ?? "Could not save");
    },
    onSuccess: () => {
      setSaved(true);
      setError("");
      setTimeout(() => setSaved(false), 2500);
      qc.invalidateQueries({ queryKey: ["traveler-profile"] });
      qc.invalidateQueries({ queryKey: ["auth-session"] }); // refresh navbar name/initials
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="max-w-2xl">
      <PageTitle title="Profile Settings" subtitle="Manage your account details." />

      {isLoading || !account ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : (
        <DashCard className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-xl font-bold text-white">
              {initialsOf(name || account.name, account.email)}
            </span>
            <div>
              <p className="font-semibold text-slate-900">{name || account.name}</p>
              <p className="text-sm text-slate-500">{account.email}</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-4"
          >
            <Field icon={<User className="h-4 w-4" />} label="Full name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent py-3 text-sm outline-none"
                placeholder="Your name"
              />
            </Field>

            <Field icon={<Mail className="h-4 w-4" />} label="Email (can't be changed)">
              <input
                value={account.email}
                disabled
                className="w-full cursor-not-allowed bg-transparent py-3 text-sm text-slate-400 outline-none"
              />
            </Field>

            <Field icon={<Phone className="h-4 w-4" />} label="Mobile">
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full bg-transparent py-3 text-sm outline-none"
                placeholder="9876543210"
              />
            </Field>

            {error && (
              <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {save.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" /> Saved
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </form>
        </DashCard>
      )}
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 focus-within:ring-2 focus-within:ring-primary/40">
        <span className="text-slate-400">{icon}</span>
        {children}
      </div>
    </label>
  );
}
