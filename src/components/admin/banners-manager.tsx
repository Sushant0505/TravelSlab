"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  X,
  Save,
  Sparkles,
  Images,
  Upload,
  ImagePlus,
  LayoutTemplate,
} from "lucide-react";
import { AdminCard, PageHeading, ActionButton } from "./ui";
import { BannerSlide } from "@/components/home/banner-slide";
import { BANNER_THEMES, type BannerDTO } from "@/lib/banners";

type FormState = Omit<BannerDTO, "id">;

const EMPTY: FormState = {
  kind: "composed",
  imageUrl: "",
  eyebrow: "",
  title: "",
  accent: "",
  subtitle: "",
  discount: "",
  cta: "View packages",
  href: "/#upcoming-trips",
  theme: "emerald",
  images: ["", "", ""],
  active: true,
  order: 0,
};

async function api(method: string, body: unknown) {
  const r = await fetch("/api/admin/banners", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d?.error ?? "Request failed");
  }
  return r.json();
}

export function BannersManager() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<BannerDTO | "new" | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async (): Promise<{ banners: BannerDTO[] }> =>
      (await fetch("/api/admin/banners")).json(),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin-banners"] });

  const toggle = useMutation({
    mutationFn: (b: BannerDTO) => api("PATCH", { id: b.id, active: !b.active }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api("DELETE", { id }),
    onSuccess: invalidate,
  });
  const seed = useMutation({
    mutationFn: () => api("POST", { action: "seed" }),
    onSuccess: invalidate,
  });

  const banners = data?.banners ?? [];

  return (
    <div>
      <PageHeading
        title="Home Banners"
        subtitle="Add, edit, reorder and toggle the promo carousel on the home page"
        action={
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
          >
            <Plus className="h-4 w-4" /> Add banner
          </button>
        }
      />

      {isLoading ? (
        <div className="py-20 text-center text-zinc-500">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <AdminCard className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-800 text-zinc-400">
            <Images className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold text-white">No banners yet</p>
            <p className="mt-1 text-sm text-zinc-400">
              The built-in starter banners are shown on the site until you add
              your own.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => seed.mutate()}
              disabled={seed.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
            >
              {seed.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Load starter banners
            </button>
            <button
              onClick={() => setEditing("new")}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Create your own
            </button>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-4">
          {banners.map((b) => (
            <AdminCard key={b.id} className="overflow-hidden">
              <div className={b.active ? "" : "opacity-50"}>
                <BannerSlide banner={b} />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="rounded bg-zinc-800 px-2 py-1 font-mono">
                    #{b.order}
                  </span>
                  <span>{b.active ? "Live on site" : "Hidden"}</span>
                </div>
                <div className="flex gap-1.5">
                  <ActionButton
                    tone={b.active ? "warning" : "success"}
                    onClick={() => toggle.mutate(b)}
                  >
                    {b.active ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Show
                      </>
                    )}
                  </ActionButton>
                  <ActionButton onClick={() => setEditing(b)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </ActionButton>
                  <ActionButton
                    tone="danger"
                    onClick={() => {
                      if (confirm(`Delete banner "${b.title}"?`)) remove.mutate(b.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </ActionButton>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <BannerEditor
            banner={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              invalidate();
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BannerEditor({
  banner,
  onClose,
  onSaved,
}: {
  banner: BannerDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    banner
      ? {
          ...banner,
          images: [banner.images[0] ?? "", banner.images[1] ?? "", banner.images[2] ?? ""],
        }
      : { ...EMPTY, images: ["", "", ""] },
  );
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        images: form.images.map((s) => s.trim()).filter(Boolean),
      };
      if (banner) return api("PATCH", { id: banner.id, ...payload });
      return api("POST", payload);
    },
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  });

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const setImage = (i: number, v: string) =>
    setForm((f) => {
      const images = [...f.images];
      images[i] = v;
      return { ...f, images };
    });

  const preview: BannerDTO = {
    ...form,
    id: "preview",
    images: form.images.filter(Boolean),
  };

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
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-5 py-4 backdrop-blur">
          <h3 className="font-semibold text-white">
            {banner ? "Edit banner" : "New banner"}
          </h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Live preview */}
          <div>
            <FieldLabel>Live preview</FieldLabel>
            <div className="overflow-hidden rounded-2xl">
              <BannerSlide banner={preview} />
            </div>
          </div>

          {/* Banner type toggle */}
          <div>
            <FieldLabel>Banner type</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <TypeOption
                active={form.kind === "image"}
                onClick={() => set({ kind: "image" })}
                icon={<Images className="h-4 w-4" />}
                title="Ready-made image"
                desc="Upload one finished banner graphic"
              />
              <TypeOption
                active={form.kind === "composed"}
                onClick={() => set({ kind: "composed" })}
                icon={<LayoutTemplate className="h-4 w-4" />}
                title="Build with text"
                desc="Gradient + headline + small images"
              />
            </div>
          </div>

          {/* ---- Ready-made image banner ---- */}
          {form.kind === "image" && (
            <div className="space-y-4">
              <div>
                <FieldLabel>Banner image (full graphic)</FieldLabel>
                <BannerImageUploader
                  value={form.imageUrl}
                  onChange={(v) => set({ imageUrl: v })}
                />
                <p className="mt-1.5 text-xs text-zinc-500">
                  For a perfect fit use a wide ~5:1 banner (e.g. 1600×320). The
                  image fills the banner strip and is center-cropped if the
                  ratio differs — check the live preview above.
                </p>
              </div>
              <Text
                label="Link (where the banner goes — optional)"
                value={form.href}
                onChange={(v) => set({ href: v })}
                placeholder="/#upcoming-trips"
              />
            </div>
          )}

          {/* ---- Composed (text) banner ---- */}
          {form.kind === "composed" && (
          <>
          <div>
            <FieldLabel>Background image (optional)</FieldLabel>
            <BannerImageUploader
              value={form.imageUrl}
              onChange={(v) => set({ imageUrl: v })}
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Sits behind the text with a colour tint for readability. Leave
              empty for a plain gradient.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Text
              label="Eyebrow"
              value={form.eyebrow}
              onChange={(v) => set({ eyebrow: v })}
              placeholder="From wishlist to window seat"
            />
            <div>
              <FieldLabel>Theme</FieldLabel>
              <select
                value={form.theme}
                onChange={(e) => set({ theme: e.target.value })}
                className={inputCls}
              >
                {BANNER_THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <Text
              label="Title"
              value={form.title}
              onChange={(v) => set({ title: v })}
              placeholder="The Bucket List Sale is"
            />
            <Text
              label="Accent (highlighted chip)"
              value={form.accent}
              onChange={(v) => set({ accent: v })}
              placeholder="LIVE"
            />
            <Text
              label="Discount / sub-line (optional)"
              value={form.discount}
              onChange={(v) => set({ discount: v })}
              placeholder="Discount up to ₹5,000*"
            />
            <Text
              label="Subtitle (optional, SEO)"
              value={form.subtitle}
              onChange={(v) => set({ subtitle: v })}
              placeholder="Book your dream departure now…"
            />
            <Text
              label="Button label"
              value={form.cta}
              onChange={(v) => set({ cta: v })}
              placeholder="View all packages"
            />
            <Text
              label="Button link"
              value={form.href}
              onChange={(v) => set({ href: v })}
              placeholder="/#upcoming-trips"
            />
          </div>

          <div>
            <FieldLabel>Banner images (up to 3 — upload or paste a URL)</FieldLabel>
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <ImageSlot
                  key={i}
                  index={i}
                  value={form.images[i]}
                  onChange={(v) => setImage(i, v)}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              Uploaded images are auto-resized and saved with the banner — no
              external image hosting needed.
            </p>
          </div>
          </>
          )}

          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set({ active: e.target.checked })}
                className="h-4 w-4 accent-violet-500"
              />
              Show on site
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              Order
              <input
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => set({ order: Number(e.target.value) || 0 })}
                className="w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white outline-none focus:border-violet-500"
              />
            </label>
          </div>

          {error && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-zinc-800 bg-zinc-900/95 px-5 py-4 backdrop-blur">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setError("");
              save.mutate();
            }}
            disabled={save.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {banner ? "Save changes" : "Create banner"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const inputCls =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-violet-500";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
      {children}
    </span>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </label>
  );
}

/** One image: thumbnail + URL field (or "uploaded" chip) + upload + clear. */
function ImageSlot({
  index,
  value,
  onChange,
}: {
  index: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const isUpload = value.startsWith("data:");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setErr("");
    if (!file.type.startsWith("image/")) return setErr("Not an image file");
    if (file.size > 12 * 1024 * 1024) return setErr("Image too large (max 12MB)");
    setBusy(true);
    try {
      onChange(await compressToDataUrl(file));
    } catch {
      setErr("Could not process that image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {/* Thumbnail */}
        <div className="relative h-11 w-9 shrink-0 overflow-hidden rounded-lg bg-zinc-950 ring-1 ring-zinc-700">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-zinc-600">
              <ImagePlus className="h-4 w-4" />
            </span>
          )}
        </div>

        {/* URL field, or an "uploaded" chip when it's a data URL */}
        {isUpload ? (
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
            <span className="inline-flex items-center gap-1.5 rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
              Uploaded image
            </span>
          </div>
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Image URL ${index + 1} — or upload →`}
            className={inputCls}
          />
        )}

        {/* Upload */}
        <label
          className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-700 px-3 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
          title="Upload an image"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{isUpload ? "Replace" : "Upload"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
        </label>

        {/* Clear */}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Remove image"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-rose-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {err && <p className="mt-1 text-xs text-rose-400">{err}</p>}
    </div>
  );
}

/**
 * Downscale + compress an image file to a JPEG data URL entirely in the
 * browser, so banners carry their own images without an upload service.
 */
function compressToDataUrl(file: File, maxDim = 720, quality = 0.8): Promise<string> {
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
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function TypeOption({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-2 rounded-xl border p-3 text-left transition-colors ${
        active
          ? "border-violet-500 bg-violet-500/10 text-white ring-1 ring-violet-500/40"
          : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
      }`}
    >
      <span
        className={`mt-0.5 ${active ? "text-violet-300" : "text-zinc-500"}`}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-zinc-500">{desc}</span>
      </span>
    </button>
  );
}

/** Big single-image uploader for ready-made banner graphics. */
function BannerImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr("");
    if (!file.type.startsWith("image/")) return setErr("Not an image file");
    if (file.size > 15 * 1024 * 1024) return setErr("Image too large (max 15MB)");
    setBusy(true);
    try {
      // Larger max dimension so a full-width banner stays crisp.
      onChange(await compressToDataUrl(file, 1600, 0.82));
    } catch {
      setErr("Could not process that image");
    } finally {
      setBusy(false);
    }
  }

  if (value) {
    return (
      <div>
        <div className="overflow-hidden rounded-xl border border-zinc-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Banner" className="block h-auto w-full" />
        </div>
        <div className="mt-2 flex gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800">
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Replace
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-rose-300"
          >
            <X className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
        {err && <p className="mt-1 text-xs text-rose-400">{err}</p>}
      </div>
    );
  }

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950/50 px-6 py-10 text-center transition-colors hover:border-violet-500 hover:bg-zinc-900">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-zinc-800 text-zinc-400">
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
        </span>
        <span className="text-sm font-medium text-zinc-200">
          Click to upload a banner image
        </span>
        <span className="text-xs text-zinc-400">
          Recommended 1600 × 320 px · wide 5:1
        </span>
        <span className="text-xs text-zinc-500">PNG, JPG or WebP · up to 15MB</span>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      {err && <p className="mt-1 text-xs text-rose-400">{err}</p>}
    </div>
  );
}
