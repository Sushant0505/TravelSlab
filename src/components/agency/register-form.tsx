"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  User,
  Mail,
  Phone,
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

interface Form {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  gstNumber: string;
  documentsUrl: string;
}

const empty: Form = {
  name: "",
  ownerName: "",
  email: "",
  phone: "",
  gstNumber: "",
  documentsUrl: "",
};

export function RegisterForm() {
  const [form, setForm] = useState<Form>(empty);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(patch: Partial<Form>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Enter your agency name";
    if (form.ownerName.trim().length < 2) e.ownerName = "Enter the owner name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Valid email required";
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Valid 10-digit phone";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/agency/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          gstNumber: form.gstNumber || undefined,
          documentsUrl: form.documentsUrl || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm"
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-slate-900">
          Application submitted
        </h2>
        <p className="mt-2 text-slate-500">
          Your agency <b>{form.name}</b> is now pending admin approval. We&apos;ll
          email <b>{form.email}</b> once you&apos;re verified — usually within 24
          hours.
        </p>
        <Link
          href="/agencies"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Preview the marketplace
        </Link>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
    >
      <div className="space-y-4">
        <Field
          label="Agency name"
          icon={<Building2 className="h-4 w-4" />}
          value={form.name}
          error={errors.name}
          onChange={(v) => set({ name: v })}
          placeholder="Wanderly Travels Pvt Ltd"
        />
        <Field
          label="Owner name"
          icon={<User className="h-4 w-4" />}
          value={form.ownerName}
          error={errors.ownerName}
          onChange={(v) => set({ ownerName: v })}
          placeholder="Rahul Mehta"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Email"
            icon={<Mail className="h-4 w-4" />}
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(v) => set({ email: v })}
            placeholder="agency@example.com"
          />
          <Field
            label="Phone"
            icon={<Phone className="h-4 w-4" />}
            type="tel"
            value={form.phone}
            error={errors.phone}
            onChange={(v) => set({ phone: v })}
            placeholder="9876543210"
          />
        </div>
        <Field
          label="GST number (optional)"
          icon={<FileText className="h-4 w-4" />}
          value={form.gstNumber}
          onChange={(v) => set({ gstNumber: v.toUpperCase() })}
          placeholder="22AAAAA0000A1Z5"
        />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            KYC documents
          </span>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 hover:border-indigo-400">
            <Upload className="h-4 w-4" />
            Upload registration / GST certificate
            <input
              type="file"
              className="hidden"
              onChange={(e) =>
                set({
                  documentsUrl: e.target.files?.[0]
                    ? `uploaded://${e.target.files[0].name}`
                    : "",
                })
              }
            />
          </label>
          {form.documentsUrl && (
            <p className="mt-1 text-xs text-emerald-600">
              Attached: {form.documentsUrl.replace("uploaded://", "")}
            </p>
          )}
        </div>

        {status === "error" && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            Something went wrong. Please check your details and try again.
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-70"
        >
          {status === "sending" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
            </>
          ) : (
            "Submit for approval"
          )}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          All agencies are manually verified before they can buy leads.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  icon,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <div
        className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 ${
          error ? "border-rose-400" : "border-slate-200"
        } focus-within:ring-2 focus-within:ring-indigo-100`}
      >
        <span className="text-slate-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-300"
        />
      </div>
      {error && <span className="mt-1 block text-xs text-rose-500">{error}</span>}
    </label>
  );
}
