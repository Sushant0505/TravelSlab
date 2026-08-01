"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/** Responsive image gallery with a lightbox. Works with remote + data URLs. */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!images.length) return null;

  const show = images.slice(0, 7);
  const go = (dir: number) =>
    setOpen((i) => (i === null ? null : (i + dir + images.length) % images.length));

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {show.map((src, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            className={`group relative overflow-hidden rounded-2xl ${
              i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-auto" : "aspect-square"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${title} photo ${i + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {i === 6 && images.length > 7 && (
              <span className="absolute inset-0 grid place-items-center bg-black/50 text-lg font-semibold text-white">
                +{images.length - 7}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            className="fixed inset-0 z-[120] grid place-items-center bg-black/90 p-4"
          >
            <button
              onClick={() => setOpen(null)}
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); go(-1); }}
                  className="absolute left-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); go(1); }}
                  className="absolute right-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            <motion.img
              key={open}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              src={images[open]}
              alt={`${title} photo ${open + 1}`}
              className="max-h-[85vh] max-w-[92vw] rounded-2xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
