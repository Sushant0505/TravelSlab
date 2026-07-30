/**
 * KYC / agency-verification documents — shared types, limits and validation.
 *
 * Documents are stored as base64 data URLs (image or PDF) so no external object
 * storage is needed — the same approach used for uploaded home banners.
 *
 * Size note: Vercel serverless functions cap a request body at ~4.5 MB and
 * base64 inflates bytes by ~33%, so each document's data URL is capped well
 * below that and images are downscaled client-side before upload.
 */

import { z } from "zod";

/** Suggested document categories an agency can attach. */
export const KYC_LABELS = [
  "GST Certificate",
  "PAN Card",
  "Business Registration",
  "Owner ID Proof",
  "Address Proof",
  "Other",
] as const;

export type KycLabel = (typeof KYC_LABELS)[number];

export const MAX_KYC_DOCS = 8;
/** Max size of a single document's data URL string (~1.5 MB). */
export const MAX_DOC_DATAURL_CHARS = 1_500_000;
/** Max combined data-URL size for one request (keeps under Vercel's ~4.5 MB). */
export const MAX_TOTAL_DATAURL_CHARS = 3_800_000;

export const KYC_ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";

/** Metadata returned to clients — never includes the heavy `dataUrl`. */
export interface KycDocMeta {
  id: string;
  label: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAtISO: string;
}

/** A document as uploaded from the browser (carries the data URL). */
export interface KycDocInput {
  label: string;
  fileName: string;
  mimeType: string;
  size: number;
  dataUrl: string;
}

const dataUrlRe = /^data:(image\/(png|jpe?g|webp)|application\/pdf);base64,/i;

/** Validates one uploaded document. Reused by the register + agency APIs. */
export const kycDocInputSchema = z.object({
  label: z.string().trim().min(1).max(60),
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(1).max(100),
  size: z.number().int().min(0).max(50_000_000),
  dataUrl: z
    .string()
    .max(MAX_DOC_DATAURL_CHARS, "Document is too large — please compress it")
    .refine((v) => dataUrlRe.test(v), "Must be a PNG, JPG, WebP or PDF file"),
});

export const kycDocListSchema = z
  .array(kycDocInputSchema)
  .max(MAX_KYC_DOCS)
  .refine(
    (docs) => docs.reduce((n, d) => n + d.dataUrl.length, 0) <= MAX_TOTAL_DATAURL_CHARS,
    "Combined document size is too large — remove or compress some files",
  );

export function isPdf(mimeType: string): boolean {
  return mimeType.toLowerCase().includes("pdf");
}

/** Human-readable size, e.g. 240 KB / 1.2 MB. */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
