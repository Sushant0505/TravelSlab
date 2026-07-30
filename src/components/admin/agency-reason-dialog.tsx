"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, PauseCircle, Ban } from "lucide-react";

/**
 * Prompts the admin for a reason before suspending or blocking an agency.
 * The note is stored and later shown under the agency's status.
 */
export function AgencyReasonDialog({
  agencyName,
  action,
  busy,
  onCancel,
  onConfirm,
}: {
  agencyName: string;
  action: "suspend" | "block";
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const isBlock = action === "block";
  const canSubmit = note.trim().length >= 3 && !busy;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 place-items-center rounded-xl ${
                isBlock ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300"
              }`}
            >
              {isBlock ? <Ban className="h-5 w-5" /> : <PauseCircle className="h-5 w-5" />}
            </span>
            <div>
              <h3 className="font-semibold text-white">
                {isBlock ? "Block" : "Suspend"} agency
              </h3>
              <p className="text-xs text-zinc-500">{agencyName}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Reason {isBlock ? "for blocking" : "for suspending"}
          </label>
          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={
              isBlock
                ? "e.g. Repeated policy violations reported by travelers."
                : "e.g. Incomplete KYC — awaiting updated GST certificate."
            }
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-500"
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            This note is saved and shown under the agency&apos;s status.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-800 px-5 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={() => canSubmit && onConfirm(note.trim())}
            disabled={!canSubmit}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              isBlock ? "bg-rose-500 hover:bg-rose-600" : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isBlock ? (
              <Ban className="h-4 w-4" />
            ) : (
              <PauseCircle className="h-4 w-4" />
            )}
            {isBlock ? "Block agency" : "Suspend agency"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
