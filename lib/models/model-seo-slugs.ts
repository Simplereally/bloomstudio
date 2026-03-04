/**
 * Model SEO Slug Registry — Phase 1 / Phase 4 Infrastructure
 *
 * Maps MODEL_REGISTRY keys to SEO-friendly URL slugs and declares
 * which page categories each model participates in.
 *
 * 10 active models: 8 image + 2 video.
 * Legacy/retired models are intentionally excluded.
 *
 * This is the single source of truth consumed by:
 *  - app/sitemap.ts (Phase 4)
 *  - app/models/[slug]/[category]/page.tsx (Phase 3)
 *  - components/layout/footer.tsx (Phase 4)
 *
 * Slug convention:
 *  - lowercase, hyphen-separated
 *  - Matches the human-recognisable model name (not the internal API id)
 */

import type { ModelType } from "@/lib/config/models";

// ============================================================================
// Types
// ============================================================================

/** The page categories available under /models/[slug]/ */
export type ModelPageCategory = "create" | "edit" | "features";

/** A single entry in the slug registry */
export interface ModelSlugEntry {
  /** MODEL_REGISTRY key (e.g. "flux", "gptimage") */
  readonly modelId: string;
  /** URL-safe slug (e.g. "flux-schnell") */
  readonly slug: string;
  /** Human display name for UI (e.g. "Flux Schnell") */
  readonly displayName: string;
  /** Model type */
  readonly type: ModelType;
  /** Page categories this model supports */
  readonly categories: readonly ModelPageCategory[];
}

// ============================================================================
// Registry
// ============================================================================

/**
 * Complete mapping of all 10 active models to their SEO slugs and page categories.
 *
 * Rules:
 *  - Every model gets "create" and "features"
 *  - Image models with supportsReferenceImage additionally get "edit"
 *  - Video models do NOT get "edit" (no pixel-level editing workflow)
 *
 * Legacy models are excluded — only actively available models belong here.
 */
export const MODEL_SEO_SLUGS: readonly ModelSlugEntry[] = [
  // ── Image Models (8) ──────────────────────────────────────────────────
  {
    modelId: "flux",
    slug: "flux-schnell",
    displayName: "Flux Schnell",
    type: "image",
    categories: ["create", "features"],
  },
  {
    modelId: "flux-2-dev",
    slug: "flux-2-dev",
    displayName: "FLUX.2 Dev",
    type: "image",
    categories: ["create", "features"],
  },
  {
    modelId: "gptimage",
    slug: "gpt-image",
    displayName: "GPT Image 1.0",
    type: "image",
    categories: ["create", "edit", "features"],
  },
  {
    modelId: "imagen-4",
    slug: "imagen-4",
    displayName: "Imagen 4",
    type: "image",
    categories: ["create", "features"],
  },
  {
    modelId: "grok-imagine",
    slug: "grok-imagine",
    displayName: "Grok Imagine",
    type: "image",
    categories: ["create", "features"],
  },
  {
    modelId: "klein",
    slug: "flux-klein-4b",
    displayName: "FLUX.2 Klein 4B",
    type: "image",
    categories: ["create", "edit", "features"],
  },
  {
    modelId: "klein-large",
    slug: "flux-klein-9b",
    displayName: "FLUX.2 Klein 9B",
    type: "image",
    categories: ["create", "edit", "features"],
  },
  {
    modelId: "zimage",
    slug: "z-image-turbo",
    displayName: "Z-Image Turbo",
    type: "image",
    categories: ["create", "features"],
  },

  // ── Video Models (2) ──────────────────────────────────────────────────
  {
    modelId: "seedance",
    slug: "seedance",
    displayName: "Seedance",
    type: "video",
    categories: ["create", "features"],
  },
  {
    modelId: "grok-video",
    slug: "grok-video",
    displayName: "Grok Video",
    type: "video",
    categories: ["create", "features"],
  },
] as const;

// ============================================================================
// Lookup Helpers
// ============================================================================

/** slug → ModelSlugEntry (O(1) lookup) */
const slugIndex = new Map<string, ModelSlugEntry>(
  MODEL_SEO_SLUGS.map((entry) => [entry.slug, entry]),
);

/** modelId → ModelSlugEntry (O(1) lookup) */
const modelIdIndex = new Map<string, ModelSlugEntry>(
  MODEL_SEO_SLUGS.map((entry) => [entry.modelId, entry]),
);

/** Get a slug entry by URL slug. Returns undefined if not found. */
export function getModelBySlug(slug: string): ModelSlugEntry | undefined {
  return slugIndex.get(slug);
}

/** Get a slug entry by MODEL_REGISTRY key. Returns undefined if not found. */
export function getModelByModelId(modelId: string): ModelSlugEntry | undefined {
  return modelIdIndex.get(modelId);
}

/** Get all unique slugs. */
export function getAllModelSlugs(): string[] {
  return MODEL_SEO_SLUGS.map((entry) => entry.slug);
}

/**
 * Get all (slug, category) pairs — used by sitemap and generateStaticParams.
 * Returns a flat array of { slug, category } objects.
 */
export function getAllModelPageParams(): { slug: string; category: ModelPageCategory }[] {
  return MODEL_SEO_SLUGS.flatMap((entry) =>
    entry.categories.map((category) => ({ slug: entry.slug, category })),
  );
}
