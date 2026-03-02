"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ScrollReveal } from "@/components/landing/scroll-reveal"
import type { ModelSEOConfig } from "@/lib/models/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Showcase image entry for the model gallery */
export interface ShowcaseImage {
  readonly src: string
  readonly alt: string
  readonly width: number
  readonly height: number
}

interface ModelShowcaseProps {
  model: ModelSEOConfig
  /** Pre-built showcase images (optional — falls back to placeholders) */
  images?: readonly ShowcaseImage[]
  variant?: "gallery" | "before-after"
}

// ---------------------------------------------------------------------------
// Placeholder helpers
// ---------------------------------------------------------------------------

function getPlaceholderDimensions(type: "image" | "video"): {
  width: number
  height: number
} {
  return type === "video"
    ? { width: 1920, height: 1080 }
    : { width: 1024, height: 1024 }
}

function buildPlaceholders(
  model: ModelSEOConfig,
  count: number
): ShowcaseImage[] {
  const dims = getPlaceholderDimensions(model.modelDefinition.type)
  return Array.from({ length: count }, (_, i) => ({
    src: `/placeholder.svg`,
    alt: `${model.displayName} example output ${i + 1}`,
    width: dims.width,
    height: dims.height,
  }))
}

// ---------------------------------------------------------------------------
// Gallery Variant
// ---------------------------------------------------------------------------

function GalleryGrid({
  model,
  images,
}: {
  model: ModelSEOConfig
  images: readonly ShowcaseImage[]
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const items = images.length > 0 ? images : buildPlaceholders(model, 6)

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((img, i) => (
          <ScrollReveal key={i} delay={i * 80}>
            <button
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "group relative w-full overflow-hidden rounded-xl",
                "bg-white/5 border border-white/10",
                "transition-all duration-300",
                "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                "hover:-translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              )}
              style={{
                aspectRatio: `${img.width} / ${img.height}`,
              }}
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={img.width}
                height={img.height}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="absolute bottom-3 left-3 text-sm font-medium text-white/90">
                  {img.alt}
                </span>
              </div>
            </button>
          </ScrollReveal>
        ))}
      </div>

      {/* Simple lightbox overlay */}
      {activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${model.displayName} example image`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          onClick={() => setActiveIndex(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setActiveIndex(null)
            if (e.key === "ArrowRight")
              setActiveIndex((prev) =>
                prev !== null ? (prev + 1) % items.length : 0
              )
            if (e.key === "ArrowLeft")
              setActiveIndex((prev) =>
                prev !== null
                  ? (prev - 1 + items.length) % items.length
                  : 0
              )
          }}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={items[activeIndex].src}
              alt={items[activeIndex].alt}
              width={items[activeIndex].width}
              height={items[activeIndex].height}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
              aria-label="Close lightbox"
            >
              &times;
            </button>

            {/* Nav arrows */}
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveIndex(
                      (prev) =>
                        prev !== null
                          ? (prev - 1 + items.length) % items.length
                          : 0
                    )
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
                  aria-label="Previous image"
                >
                  &#8592;
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveIndex(
                      (prev) =>
                        prev !== null ? (prev + 1) % items.length : 0
                    )
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
                  aria-label="Next image"
                >
                  &#8594;
                </button>
              </>
            )}

            {/* Caption */}
            <p className="mt-3 text-center text-sm text-muted-foreground">
              {items[activeIndex].alt}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Before/After Variant
// ---------------------------------------------------------------------------

function BeforeAfterGrid({
  model,
  images,
}: {
  model: ModelSEOConfig
  images: readonly ShowcaseImage[]
}) {
  const items = images.length >= 2 ? images : buildPlaceholders(model, 4)

  // Group into pairs for comparison
  const pairs: Array<{
    before: ShowcaseImage
    after: ShowcaseImage
  }> = []

  for (let i = 0; i < items.length - 1; i += 2) {
    pairs.push({ before: items[i], after: items[i + 1] })
  }

  return (
    <div className="space-y-8">
      {pairs.map((pair, i) => (
        <ScrollReveal key={i} delay={i * 120}>
          <div className="grid grid-cols-2 gap-4">
            {/* Before */}
            <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10">
              <div className="absolute top-3 left-3 z-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 text-xs font-medium text-white/80">
                Before
              </div>
              <Image
                src={pair.before.src}
                alt={pair.before.alt}
                width={pair.before.width}
                height={pair.before.height}
                className="h-full w-full object-cover"
                style={{
                  aspectRatio: `${pair.before.width} / ${pair.before.height}`,
                }}
              />
            </div>

            {/* After */}
            <div className="relative overflow-hidden rounded-xl bg-white/5 border border-primary/20">
              <div className="absolute top-3 left-3 z-10 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 px-3 py-1 text-xs font-medium text-primary">
                After
              </div>
              <Image
                src={pair.after.src}
                alt={pair.after.alt}
                width={pair.after.width}
                height={pair.after.height}
                className="h-full w-full object-cover"
                style={{
                  aspectRatio: `${pair.after.width} / ${pair.after.height}`,
                }}
              />
            </div>
          </div>
        </ScrollReveal>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exported Component
// ---------------------------------------------------------------------------

export function ModelShowcase({
  model,
  variant = "gallery",
  images = [],
}: ModelShowcaseProps) {
  const heading =
    variant === "before-after"
      ? `${model.displayName} Editing Examples`
      : `${model.displayName} Example Outputs`

  const subtitle =
    variant === "before-after"
      ? `See how ${model.displayName} transforms and refines your images.`
      : `Explore what you can create with ${model.displayName}.`

  return (
    <section className="py-24 bg-black/20 border-y border-white/5">
      <div className="container mx-auto px-6 max-w-5xl">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{heading}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {subtitle}
            </p>
          </div>
        </ScrollReveal>

        {variant === "before-after" ? (
          <BeforeAfterGrid model={model} images={images} />
        ) : (
          <GalleryGrid model={model} images={images} />
        )}
      </div>
    </section>
  )
}
