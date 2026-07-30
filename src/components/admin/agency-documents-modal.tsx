"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  FileText,
  ImageIcon,
  Download,
  ExternalLink,
  ShieldCheck,
  FileQuestion,
  Info,
} from "lucide-react";
import { StatusBadge, ActionButton } from "./ui";
import { isPdf, formatBytes, type KycDocMeta } from "@/lib/kyc";
import type { AdminAgency } from "@/server/admin-repo";

function docUrl(agencyId: string, docId: string): string {
  return `/api/admin/agencies/document?agencyId=${encodeURIComponent(
    agencyId,
  )}&docId=${encodeURIComponent(docId)}`;
}

export function AgencyDocumentsModal({
  agency,
  onClose,
  onAction,
  busy,
}: {
  agency: AdminAgency;
  onClose: () => void;
  onAction: (action: "approve" | "suspend" | "block") => void;
  busy?: boolean;
}) {
  const docs = agency.documents;
  const [selected, setSelected] = useState<KycDocMeta | null>(docs[0] ?? null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[110] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-white">{agency.name}</h3>
              <StatusBadge status={agency.status} />
            </div>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {agency.ownerName} · {agency.email}
              {agency.gstNumber ? ` · GST ${agency.gstNumber}` : ""}
            </p>
            {(agency.status === "SUSPENDED" || agency.status === "BLOCKED") &&
              agency.statusNote && (
                <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-zinc-800/70 px-2.5 py-1.5 text-xs text-zinc-300">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                  <span>
                    <span className="font-medium text-zinc-200">
                      {agency.status === "BLOCKED" ? "Blocked" : "Suspended"}:
                    </span>{" "}
                    {agency.statusNote}
                  </span>
                </p>
              )}
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-400 hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        {docs.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-zinc-800 text-zinc-500">
              <FileQuestion className="h-7 w-7" />
            </span>
            <p className="font-medium text-white">No documents uploaded</p>
            <p className="max-w-xs text-sm text-zinc-500">
              This agency hasn&apos;t attached any KYC files yet. Approve with
              caution or ask them to upload verification documents.
            </p>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] overflow-hidden lg:grid-cols-[300px_1fr] lg:grid-rows-1">
            {/* Document list */}
            <ul className="overflow-y-auto border-b border-zinc-800 p-3 lg:border-b-0 lg:border-r">
              {docs.map((d) => {
                const active = selected?.id === d.id;
                return (
                  <li key={d.id}>
                    <button
                      onClick={() => setSelected(d)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        active ? "bg-zinc-800 ring-1 ring-indigo-500/40" : "hover:bg-zinc-800/60"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                          isPdf(d.mimeType)
                            ? "bg-rose-500/15 text-rose-300"
                            : "bg-indigo-500/15 text-indigo-300"
                        }`}
                      >
                        {isPdf(d.mimeType) ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">
                          {d.label}
                        </span>
                        <span className="block truncate text-xs text-zinc-500">
                          {d.fileName} · {formatBytes(d.size)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Preview */}
            <div className="flex min-h-0 flex-col">
              {selected && (
                <>
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-4 py-2.5">
                    <span className="truncate text-sm text-zinc-300">
                      {selected.fileName}
                    </span>
                    <div className="flex shrink-0 gap-1.5">
                      <a
                        href={docUrl(agency.id, selected.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open
                      </a>
                      <a
                        href={docUrl(agency.id, selected.id)}
                        download={selected.fileName}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    </div>
                  </div>
                  <div className="min-h-[280px] flex-1 overflow-auto bg-zinc-950/60 p-3">
                    {isPdf(selected.mimeType) ? (
                      <iframe
                        key={selected.id}
                        src={docUrl(agency.id, selected.id)}
                        title={selected.fileName}
                        className="h-[52vh] w-full rounded-lg bg-white"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={selected.id}
                        src={docUrl(agency.id, selected.id)}
                        alt={selected.fileName}
                        className="mx-auto max-h-[52vh] rounded-lg object-contain"
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer — verification actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 px-5 py-4">
          <p className="text-xs text-zinc-500">
            {docs.length} document{docs.length === 1 ? "" : "s"} on file
          </p>
          <div className="flex gap-2">
            {agency.status !== "SUSPENDED" && (
              <ActionButton tone="warning" onClick={() => onAction("suspend")}>
                Suspend
              </ActionButton>
            )}
            {agency.status !== "BLOCKED" && (
              <ActionButton tone="danger" onClick={() => onAction("block")}>
                Block
              </ActionButton>
            )}
            {agency.status !== "APPROVED" && (
              <button
                onClick={() => onAction("approve")}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
              >
                <ShieldCheck className="h-4 w-4" /> Approve &amp; verify
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
