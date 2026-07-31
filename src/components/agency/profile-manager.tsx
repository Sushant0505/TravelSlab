"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Building2, User, Phone, FileText, MapPin, Lock, CheckCircle2 } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  gstNumber: string;
  city: string;
  status: string;
}

export function AgencyProfileManager() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["agency-profile"],
    queryFn: async (): Promise<{ profile: Profile }> =>
      (await fetch("/api/agency/profile")).json(),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Profile settings</h1>
        <p className="text-sm text-slate-500">
          Manage your agency details and password.
        </p>
      </div>

      {isLoading || !data?.profile ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          <ProfileCard profile={data.profile} onSaved={() => qc.invalidateQueries({ queryKey: ["agency-profile"] })} />
          <PasswordCard />
        </div>
      )}
    </div>
  );
}

function ProfileCard({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: profile.name,
    ownerName: profile.ownerName,
    phone: profile.phone,
    gstNumber: profile.gstNumber,
    city: profile.city,
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setForm({
      name: profile.name,
      ownerName: profile.ownerName,
      phone: profile.phone,
      gstNumber: profile.gstNumber,
      city: profile.city,
    });
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/agency/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error ?? "Could not save");
    },
    onSuccess: () => {
      setErr("");
      setMsg("Profile updated.");
      onSaved();
    },
    onError: (e: Error) => {
      setMsg("");
      setErr(e.message);
    },
  });

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-800">Agency details</h2>
      <div className="space-y-4">
        <Field icon={<Building2 className="h-4 w-4" />} label="Agency name" value={form.name} onChange={(v) => set({ name: v })} />
        <Field icon={<User className="h-4 w-4" />} label="Owner name" value={form.ownerName} onChange={(v) => set({ ownerName: v })} />
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
            {profile.email} <span className="ml-auto text-xs">(cannot change)</span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field icon={<Phone className="h-4 w-4" />} label="Phone" value={form.phone} onChange={(v) => set({ phone: v })} />
          <Field icon={<MapPin className="h-4 w-4" />} label="City" value={form.city} onChange={(v) => set({ city: v })} />
        </div>
        <Field icon={<FileText className="h-4 w-4" />} label="GST number" value={form.gstNumber} onChange={(v) => set({ gstNumber: v.toUpperCase() })} />

        {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{err}</p>}
        {msg && (
          <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> {msg}
          </p>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => { setMsg(""); setErr(""); save.mutate(); }}
            disabled={save.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
        </div>
      </div>
    </section>
  );
}

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const change = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/agency/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next, confirmPassword: confirm }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error ?? "Could not change password");
    },
    onSuccess: () => {
      setErr("");
      setMsg("Password changed.");
      setCurrent(""); setNext(""); setConfirm("");
    },
    onError: (e: Error) => { setMsg(""); setErr(e.message); },
  });

  function submit() {
    setMsg(""); setErr("");
    if (next.length < 8) return setErr("New password must be at least 8 characters");
    if (next !== confirm) return setErr("Passwords do not match");
    change.mutate();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-800">Change password</h2>
      <div className="space-y-4">
        <PwField label="Current password" value={current} onChange={setCurrent} />
        <div className="grid gap-4 sm:grid-cols-2">
          <PwField label="New password" value={next} onChange={setNext} />
          <PwField label="Confirm new password" value={confirm} onChange={setConfirm} />
        </div>

        {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{err}</p>}
        {msg && (
          <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> {msg}
          </p>
        )}

        <div className="flex justify-end">
          <button
            onClick={submit}
            disabled={change.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {change.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Update password
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-100">
        <span className="text-slate-400">{icon}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-800 outline-none"
        />
      </div>
    </label>
  );
}

function PwField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-100">
        <Lock className="h-4 w-4 text-slate-400" />
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-800 outline-none"
        />
      </div>
    </label>
  );
}
