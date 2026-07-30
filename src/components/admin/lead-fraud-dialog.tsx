"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, ShieldX } from "lucide-react";

/**
 * Prompts the admin for a reason before flagging a lead as fraud.
 * The note is stored and shown under the lead's status.
 */
export function LeadFraudDialog({
  reference,
  travelerName,
  busy,
  onCancel,
  onConfirm,
}: {
  reference: string;
  travelerName: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
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
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/15 text-rose-300">
              <ShieldX className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold text-white">Mark lead as fraud</h3>
              <p className="text-xs text-zinc-500">
                {reference} · {travelerName}
              </p>
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
            Reason for flagging
          </label>
          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="e.g. Fake number, mismatched contact, or spam enquiry."
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-rose-500"
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            This note is saved and shown under the lead&apos;s status.
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
            className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}
            Mark as fraud
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
