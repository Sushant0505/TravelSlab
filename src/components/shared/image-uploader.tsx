"use client";

import { useState } from "react";
import { Loader2, Upload, X, ImagePlus, GripVertical } from "lucide-react";
import { compressToDataUrl } from "@/lib/image-compress";

/**
 * Reusable image uploaders shared by the admin (dark) and agency (light)
 * package/destination forms. Images are compressed to data URLs in the browser
 * — no external object storage. Pass `dark` for the admin console palette.
 */

interface Palette {
  border: string;
  panel: string;
  text: string;
  subtle: string;
  hover: string;
  dashed: string;
}
function palette(dark?: boolean): Palette {
  return dark
    ? {
        border: "border-zinc-700",
        panel: "bg-zinc-950",
        text: "text-zinc-200",
        subtle: "text-zinc-500",
        hover: "hover:bg-zinc-800",
        dashed: "border-zinc-700 hover:border-violet-500 hover:bg-zinc-900",
      }
    : {
        border: "border-slate-200",
        panel: "bg-white",
        text: "text-slate-700",
        subtle: "text-slate-400",
        hover: "hover:bg-slate-50",
        dashed: "border-slate-300 hover:border-indigo-400 hover:bg-slate-50",
      };
}

async function pickCompressed(
  e: React.ChangeEvent<HTMLInputElement>,
  onErr: (m: string) => void,
  maxDim = 1280,
): Promise<string[]> {
  const files = Array.from(e.target.files ?? []);
  e.target.value = "";
  onErr("");
  const out: string[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      onErr("Some files were not images and were skipped");
      continue;
    }
    if (file.size > 15 * 1024 * 1024) {
      onErr("An image over 15MB was skipped");
      continue;
    }
    try {
      out.push(await compressToDataUrl(file, maxDim));
    } catch {
      onErr("Could not process one of the images");
    }
  }
  return out;
}

/** Single hero image with a large drop zone + preview. */
export function SingleImageUploader({
  value,
  onChange,
  dark,
  hint,
  aspect = "aspect-[16/9]",
}: {
  value: string;
  onChange: (v: string) => void;
  dark?: boolean;
  hint?: string;
  aspect?: string;
}) {
  const p = palette(dark);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setBusy(true);
    const [img] = await pickCompressed(e, setErr, 1600);
    if (img) onChange(img);
    setBusy(false);
  }

  if (value) {
    return (
      <div>
        <div className={`relative overflow-hidden rounded-xl border ${p.border} ${aspect}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="mt-2 flex gap-2">
          <label
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border ${p.border} px-3 py-1.5 text-xs font-medium ${p.text} ${p.hover}`}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Replace
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
          <button
            type="button"
            onClick={() => onChange("")}
            className={`inline-flex items-center gap-1.5 rounded-lg border ${p.border} px-3 py-1.5 text-xs font-medium ${p.subtle} ${p.hover}`}
          >
            <X className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
        {err && <p className="mt-1 text-xs text-rose-500">{err}</p>}
      </div>
    );
  }

  return (
    <div>
      <label
        className={`flex ${aspect} cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed ${p.dashed} px-6 text-center transition-colors`}
      >
        <span className={`grid h-11 w-11 place-items-center rounded-full ${dark ? "bg-zinc-800" : "bg-slate-100"} ${p.subtle}`}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
        </span>
        <span className={`text-sm font-medium ${p.text}`}>Click to upload an image</span>
        <span className={`text-xs ${p.subtle}`}>{hint ?? "PNG, JPG or WebP · auto-resized"}</span>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      {err && <p className="mt-1 text-xs text-rose-500">{err}</p>}
    </div>
  );
}

/** Multi-image gallery: add many, remove, reorder (first = cover). */
export function GalleryUploader({
  values,
  onChange,
  dark,
  max = 10,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  dark?: boolean;
  max?: number;
}) {
  const p = palette(dark);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setBusy(true);
    const imgs = await pickCompressed(e, setErr, 1280);
    if (imgs.length) onChange([...values, ...imgs].slice(0, max));
    setBusy(false);
  }
  const removeAt = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  const moveLeft = (i: number) => {
    if (i === 0) return;
    const next = [...values];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {values.map((src, i) => (
          <div
            key={i}
            className={`group relative aspect-square overflow-hidden rounded-lg border ${p.border}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Cover
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => moveLeft(i)}
                  title="Move earlier"
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-700 hover:bg-white"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                title="Remove"
                className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-rose-600 hover:bg-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {values.length < max && (
          <label
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed ${p.dashed} text-center transition-colors`}
          >
            {busy ? (
              <Loader2 className={`h-5 w-5 animate-spin ${p.subtle}`} />
            ) : (
              <ImagePlus className={`h-5 w-5 ${p.subtle}`} />
            )}
            <span className={`px-1 text-[11px] font-medium ${p.subtle}`}>Add photos</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
          </label>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <p className={`text-xs ${p.subtle}`}>
          {values.length}/{max} · first image is the cover
        </p>
        {err && <p className="text-xs text-rose-500">{err}</p>}
      </div>
    </div>
  );
}
