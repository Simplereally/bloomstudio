import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ScrollReveal } from "@/components/landing/scroll-reveal"
import {
  MODEL_PAGE_CATEGORIES,
  type ModelPageCategory,
  type ModelSEOConfig,
} from "@/lib/models/types"
import { MODEL_SEO_SLUGS, type ModelSlugEntry } from "@/lib/models/model-seo-slugs"
import { MODEL_REGISTRY } from "@/lib/config/models"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModelInternalLinksProps {
  /** The model currently being viewed */
  currentModel: ModelSEOConfig
  /** The category page currently being viewed */
  currentCategory: ModelPageCategory
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildModelCategoryPath(
  slug: string,
  category: ModelPageCategory
): string {
  return `/models/${slug}/${category}`
}

/**
 * Resolve the provider logo path for a given slug entry.
 * Falls back to the MODEL_REGISTRY logo if available.
 */
function getLogoForEntry(entry: ModelSlugEntry): string | undefined {
  return MODEL_REGISTRY[entry.modelId]?.logo
}

/**
 * Derive a short provider name from the model's logo path.
 * Kept minimal to avoid duplicating the full provider map.
 */
function getProviderName(entry: ModelSlugEntry): string {
  const logo = getLogoForEntry(entry)
  if (!logo) return ""

  const providers: Record<string, string> = {
    "flux.svg": "Black Forest Labs",
    "openai.svg": "OpenAI",
    "google.svg": "Google",
    "bytedance.svg": "ByteDance",
    "alibaba.svg": "Alibaba",
    "stability.svg": "Stability AI",
    "xai.svg": "xAI",
  }

  const filename = logo.split("/").pop() ?? ""
  return providers[filename] ?? ""
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function ModelLinkCard({
  entry,
  category,
  delay,
}: {
  entry: ModelSlugEntry
  category: ModelPageCategory
  delay: number
}) {
  const logo = getLogoForEntry(entry)
  const providerName = getProviderName(entry)

  const isMonochromeLogo =
    logo?.includes("openai.svg") ||
    logo?.includes("flux.svg") ||
    logo?.includes("xai.svg")

  return (
    <ScrollReveal delay={delay}>
      <Link
        href={buildModelCategoryPath(entry.slug, category)}
        className={cn(
          "group flex items-center gap-4 p-4 rounded-xl",
          "bg-white/5 backdrop-blur-sm border border-white/10",
          "transition-all duration-300",
          "hover:border-primary/30 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-primary/5",
          "hover:-translate-y-0.5"
        )}
      >
        {/* Logo */}
        {logo ? (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/5 p-1.5 border border-white/10">
            <Image
              src={logo}
              alt={`${providerName} logo`}
              width={40}
              height={40}
              className={cn(
                "h-full w-full object-contain",
                isMonochromeLogo && "dark:invert"
              )}
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-sm font-bold text-muted-foreground">
            {entry.displayName.charAt(0)}
          </div>
        )}

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {entry.displayName}
          </p>
          {providerName && (
            <p className="text-xs text-muted-foreground truncate">
              {providerName}
            </p>
          )}
        </div>

        {/* Arrow */}
        <span
          className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        >
          &rarr;
        </span>
      </Link>
    </ScrollReveal>
  )
}

function CategoryLinkCard({
  model,
  category,
  delay,
}: {
  model: ModelSEOConfig
  category: ModelPageCategory
  delay: number
}) {
  const meta = MODEL_PAGE_CATEGORIES[category]

  return (
    <ScrollReveal delay={delay}>
      <Link
        href={buildModelCategoryPath(model.slug, category)}
        className={cn(
          "group block p-5 rounded-xl",
          "bg-white/5 backdrop-blur-sm border border-white/10",
          "transition-all duration-300",
          "hover:border-primary/30 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-primary/5",
          "hover:-translate-y-0.5"
        )}
      >
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {model.displayName}: {meta.label}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {meta.description}
        </p>
      </Link>
    </ScrollReveal>
  )
}

// ---------------------------------------------------------------------------
// Exported Component
// ---------------------------------------------------------------------------

/**
 * ModelInternalLinks — Cross-linking grid for SEO internal linking.
 *
 * Two sections:
 * 1. "Other [image/video] models" — same category, different models
 * 2. "Related pages" — same model, different categories
 *
 * Uses the MODEL_SEO_SLUGS registry to find all cross-link targets.
 *
 * Server Component — no client JS required.
 */
export function ModelInternalLinks({
  currentModel,
  currentCategory,
}: ModelInternalLinksProps) {
  const modelType = currentModel.modelDefinition.type

  // Other models that support the same category (same type only)
  const sameCategoryModels = MODEL_SEO_SLUGS.filter(
    (entry) =>
      entry.modelId !== currentModel.modelId &&
      entry.type === modelType &&
      entry.categories.includes(currentCategory)
  )

  // Other category pages for the current model
  const relatedCategories = currentModel.categories.filter(
    (c) => c !== currentCategory
  )

  const typeLabel = modelType === "video" ? "video" : "image"

  const hasSameCategory = sameCategoryModels.length > 0
  const hasRelatedCategories = relatedCategories.length > 0

  if (!hasSameCategory && !hasRelatedCategories) return null

  return (
    <section className="py-24">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Other models in same category */}
        {hasSameCategory && (
          <div className="mb-16">
            <ScrollReveal>
              <h3 className="text-2xl font-bold mb-2">
                Other {typeLabel} models
              </h3>
              <p className="text-muted-foreground mb-8">
                Compare {currentModel.displayName} with other{" "}
                {MODEL_PAGE_CATEGORIES[currentCategory].label.toLowerCase()}{" "}
                models.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sameCategoryModels.map((entry, i) => (
                <ModelLinkCard
                  key={entry.modelId}
                  entry={entry}
                  category={currentCategory}
                  delay={i * 60}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other pages for current model */}
        {hasRelatedCategories && (
          <div>
            <ScrollReveal>
              <h3 className="text-2xl font-bold mb-2">Related pages</h3>
              <p className="text-muted-foreground mb-8">
                Explore more about {currentModel.displayName}.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedCategories.map((cat, i) => (
                <CategoryLinkCard
                  key={cat}
                  model={currentModel}
                  category={cat}
                  delay={i * 60}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
