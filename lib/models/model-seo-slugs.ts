/**
 * Model SEO Slug Registry — Phase 1 / Phase 4 Infrastructure
 *
 * Maps MODEL_REGISTRY keys to SEO-friendly URL slugs and declares
 * which page categories each model participates in.
 *
 * Legacy/retired models are automatically excluded by filtering against
 * MODEL_REGISTRY.isLegacy at module load time. Adding `isLegacy: true`
 * to any model in lib/config/models.ts is sufficient to remove it from
 * sitemap, static params, and footer links.
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

import { MODEL_REGISTRY, type ModelType } from "@/lib/config/models";

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
// SEO Metadata (static, per-model)
// ============================================================================

/**
 * Hand-maintained SEO metadata for every model that *could* appear in the slug
 * registry. Each entry maps a MODEL_REGISTRY key to its URL slug, display name
 * override, and supported page categories.
 *
 * Rules:
 *  - Every model gets "create" and "features"
 *  - Image models with supportsReferenceImage additionally get "edit"
 *  - Video models do NOT get "edit" (no pixel-level editing workflow)
 *
 * This is intentionally a flat array so ordering is explicit and reviewable.
 * Legacy filtering happens below when building MODEL_SEO_SLUGS.
 */
const SEO_METADATA: readonly ModelSlugEntry[] = [
  // ── Image Models ──────────────────────────────────────────────────────
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

  // ── Video Models ──────────────────────────────────────────────────────
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
];

// ============================================================================
// Registry (derived — legacy models automatically excluded)
// ============================================================================

/**
 * Active-only model SEO slug entries, derived by filtering SEO_METADATA against
 * MODEL_REGISTRY.isLegacy. This guarantees the active-only invariant: marking a
 * model as legacy in one place (lib/config/models.ts) is sufficient.
 */
export const MODEL_SEO_SLUGS: readonly ModelSlugEntry[] = SEO_METADATA.filter(
  (entry) => {
    const model = MODEL_REGISTRY[entry.modelId];
    return model != null && !model.isLegacy;
  },
);

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
