"use client";

import { useRef, useState } from "react";
import { Upload, FileText, ImageIcon, X, Loader2 } from "lucide-react";
import {
  KYC_LABELS,
  KYC_ACCEPT,
  MAX_KYC_DOCS,
  MAX_DOC_DATAURL_CHARS,
  MAX_TOTAL_DATAURL_CHARS,
  isPdf,
  formatBytes,
  type KycDocInput,
} from "@/lib/kyc";

/**
 * Controlled multi-file KYC uploader (images + PDF).
 *
 * Images are downscaled + compressed in the browser; PDFs are attached as-is
 * (size-capped). Everything becomes a base64 data URL so it can be persisted
 * without an object-storage service. Styled for a light background — used on
 * the agency registration form and the agency-panel verification page.
 */
export function KycUploader({
  value,
  onChange,
  disabled,
}: {
  value: KycDocInput[];
  onChange: (docs: KycDocInput[]) => void;
  disabled?: boolean;
}) {
  const [label, setLabel] = useState<string>(KYC_LABELS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErr("");
    const remaining = MAX_KYC_DOCS - value.length;
    if (remaining <= 0) {
      setErr(`You can attach up to ${MAX_KYC_DOCS} documents.`);
      return;
    }
    setBusy(true);
    try {
      const next = [...value];
      let firstError = "";
      for (const file of Array.from(files).slice(0, remaining)) {
        const result = await processFile(file, label);
        if (typeof result === "string") {
          firstError ||= result;
          continue;
        }
        next.push(result);
      }
      const total = next.reduce((n, d) => n + d.dataUrl.length, 0);
      if (total > MAX_TOTAL_DATAURL_CHARS) {
        setErr("Combined size is too large — remove or compress some files.");
      } else {
        onChange(next);
        if (firstError) setErr(firstError);
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const atLimit = value.length >= MAX_KYC_DOCS;

  return (
    <div>
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="text-xs font-medium text-slate-500">Document type</label>
        <select
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={disabled}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
        >
          {KYC_LABELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center text-sm transition-colors ${
          disabled || atLimit
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
            : "border-slate-300 bg-slate-50 text-slate-500 hover:border-indigo-400 hover:bg-indigo-50/40"
        }`}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
        ) : (
          <Upload className="h-5 w-5" />
        )}
        <span className="font-medium">
          {atLimit
            ? `Maximum ${MAX_KYC_DOCS} documents attached`
            : `Upload ${label}`}
        </span>
        <span className="text-xs text-slate-400">
          PNG, JPG, WebP or PDF · up to ~1&nbsp;MB each
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={KYC_ACCEPT}
          multiple
          className="hidden"
          disabled={disabled || busy || atLimit}
          onChange={(e) => onFiles(e.target.files)}
        />
      </label>

      {err && <p className="mt-1.5 text-xs text-rose-600">{err}</p>}

      {value.length > 0 && (
        <ul className="mt-3 space-y-2">
          {value.map((doc, i) => (
            <li
              key={`${doc.fileName}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                  isPdf(doc.mimeType)
                    ? "bg-rose-50 text-rose-500"
                    : "bg-indigo-50 text-indigo-500"
                }`}
              >
                {isPdf(doc.mimeType) ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-800">
                    {doc.fileName}
                  </span>
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    {doc.label}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{formatBytes(doc.size)}</span>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  title="Remove"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Returns a ready-to-send doc, or an error message string. */
async function processFile(file: File, label: string): Promise<KycDocInput | string> {
  const type = file.type.toLowerCase();
  const isImage = type.startsWith("image/");
  const pdf = type === "application/pdf";
  if (!isImage && !pdf) return `“${file.name}” is not a supported file type.`;
  if (file.size > 25 * 1024 * 1024) return `“${file.name}” is too large.`;

  try {
    if (pdf) {
      const dataUrl = await readAsDataUrl(file);
      if (dataUrl.length > MAX_DOC_DATAURL_CHARS)
        return `“${file.name}” is too large — please compress the PDF (max ~1 MB).`;
      return {
        label,
        fileName: file.name,
        mimeType: "application/pdf",
        size: file.size,
        dataUrl,
      };
    }
    // Image → downscale + compress to JPEG.
    const dataUrl = await compressImage(file);
    if (dataUrl.length > MAX_DOC_DATAURL_CHARS)
      return `“${file.name}” is too large even after compression.`;
    return {
      label,
      fileName: file.name,
      mimeType: "image/jpeg",
      size: Math.round(dataUrl.length * 0.75),
      dataUrl,
    };
  } catch {
    return `Could not read “${file.name}”.`;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

/** Downscale to fit `maxDim` and encode JPEG on a white background. */
function compressImage(file: File, maxDim = 1400, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas context"));
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
