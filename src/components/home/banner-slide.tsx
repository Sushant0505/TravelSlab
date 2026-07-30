"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { bannerGradientCss, type BannerDTO } from "@/lib/banners";

/**
 * Fixed, responsive banner-strip height shared by every slide (composed +
 * ready-made image) so the carousel never jumps and uploaded graphics always
 * fill the same area. ~5:1 on desktop to match the recommended 1600×320 upload.
 */
const BANNER_HEIGHT = "h-40 sm:h-48 md:h-56";

/** A single promo banner slide. Shared by the home carousel + admin preview. */
export function BannerSlide({ banner }: { banner: BannerDTO }) {
  // Ready-made image banner — the whole graphic links to `href`.
  if (banner.kind === "image") {
    if (!banner.imageUrl) {
      return (
        <div className={`grid ${BANNER_HEIGHT} place-items-center bg-slate-100 text-center text-slate-400`}>
          <div>
            <p className="text-sm font-medium">Upload a banner image</p>
            <p className="mt-1 text-xs text-slate-400">
              Recommended 1600 × 320 px · wide 5:1
            </p>
          </div>
        </div>
      );
    }
    const img = (
      // Uploaded graphic fills the fixed banner strip so every slide is the
      // same size — no height jumps, no oversized images.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={banner.imageUrl}
        alt={banner.title || "Promotional banner"}
        className={`block w-full ${BANNER_HEIGHT} object-cover object-center`}
      />
    );
    return banner.href ? (
      <Link href={banner.href} className="block">
        {img}
      </Link>
    ) : (
      img
    );
  }

  const hasBg = Boolean(banner.imageUrl);
  return (
    <div className={`relative flex ${BANNER_HEIGHT} items-center justify-between gap-4 overflow-hidden px-6 md:px-10`}>
      {/* Optional background photo */}
      {hasBg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* Gradient: full colour normally, or a readable tint over a photo */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: bannerGradientCss(banner.theme, { overlay: hasBg }) }}
      />

      {/* Watermark wordmark, echoing the reference banner */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none truncate text-center font-display text-4xl font-black uppercase tracking-widest text-white/10 md:text-6xl"
      >
        TripSlab · TripSlab
      </span>

      {/* Copy */}
      <div className="relative z-10 min-w-0 text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] backdrop-blur">
          {banner.eyebrow}
        </span>
        <h2 className="mt-2 font-display text-xl font-black leading-tight sm:text-2xl md:text-3xl">
          {banner.title}{" "}
          {banner.accent && (
            <span className="ml-0.5 inline-block rounded-lg bg-amber-300 px-2 py-0.5 text-slate-900 shadow-sm">
              {banner.accent}
            </span>
          )}
        </h2>
        {banner.discount && (
          <p className="mt-2 hidden text-sm font-bold uppercase tracking-wide text-white/95 sm:block">
            {banner.discount}
          </p>
        )}
      </div>

      {/* Right: image collage + CTA */}
      <div className="relative z-10 flex shrink-0 items-center gap-3 md:gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          {banner.images.slice(0, 3).map((src, i) => (
            <div
              key={i}
              className="relative aspect-[3/4] w-14 overflow-hidden rounded-xl ring-2 ring-white/40 md:w-16"
            >
              {src.startsWith("data:") ? (
                // Uploaded/inline image — skip the optimizer.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <Image src={src} alt="" fill sizes="64px" className="object-cover" />
              )}
            </div>
          ))}
        </div>
        {banner.cta && (
          <Link
            href={banner.href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition-transform hover:scale-105"
          >
            {banner.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
