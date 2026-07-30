"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  ImageIcon,
  ExternalLink,
  Trash2,
  Loader2,
  ShieldCheck,
  Save,
  FileQuestion,
} from "lucide-react";
import { KycUploader } from "./kyc-uploader";
import { isPdf, formatBytes, type KycDocMeta, type KycDocInput } from "@/lib/kyc";

function docUrl(docId: string): string {
  return `/api/agency/kyc/document?docId=${encodeURIComponent(docId)}`;
}

export function KycManager() {
  const qc = useQueryClient();
  const [staged, setStaged] = useState<KycDocInput[]>([]);
  const [err, setErr] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["agency-kyc"],
    queryFn: async (): Promise<{ documents: KycDocMeta[] }> =>
      (await fetch("/api/agency/kyc")).json(),
  });
  const documents = data?.documents ?? [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ["agency-kyc"] });

  const del = useMutation({
    mutationFn: async (docId: string) => {
      const r = await fetch("/api/agency/kyc", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId }),
      });
      if (!r.ok) throw new Error();
    },
    onSuccess: invalidate,
  });

  const submit = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/agency/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: staged }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.error ?? "Upload failed");
      }
      return r.json();
    },
    onSuccess: () => {
      setStaged([]);
      setErr("");
      invalidate();
    },
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Verification documents</h1>
        <p className="text-sm text-slate-500">
          Upload your KYC files so our team can verify your agency. Keep them
          current — GST certificate, PAN and business registration.
        </p>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
        <p className="text-sm text-slate-600">
          Documents are reviewed by an admin. They&apos;re stored securely and
          only visible to the TripSlab verification team.
        </p>
      </div>

      {/* Uploaded documents */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          On file ({documents.length})
        </h2>

        {isLoading ? (
          <div className="py-10 text-center text-slate-400">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <FileQuestion className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium text-slate-600">No documents yet</p>
            <p className="text-xs text-slate-400">Add your first KYC file below.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {documents.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5"
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    isPdf(d.mimeType)
                      ? "bg-rose-50 text-rose-500"
                      : "bg-indigo-50 text-indigo-500"
                  }`}
                >
                  {isPdf(d.mimeType) ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-800">
                      {d.fileName}
                    </span>
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      {d.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatBytes(d.size)} ·{" "}
                    {new Date(d.uploadedAtISO).toLocaleDateString()}
                  </span>
                </div>
                <a
                  href={docUrl(d.id)}
                  target="_blank"
                  rel="noreferrer"
                  title="View"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => {
                    if (confirm(`Remove “${d.fileName}”?`)) del.mutate(d.id);
                  }}
                  disabled={del.isPending}
                  title="Remove"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Add documents */}
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Add documents</h2>
        <KycUploader value={staged} onChange={setStaged} />
        {err && <p className="mt-2 text-sm text-rose-600">{err}</p>}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setErr("");
              submit.mutate();
            }}
            disabled={staged.length === 0 || submit.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {submit.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {staged.length > 0
              ? `Submit ${staged.length} document${staged.length === 1 ? "" : "s"}`
              : "Submit documents"}
          </button>
        </div>
      </section>
    </div>
  );
}
