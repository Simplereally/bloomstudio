/**
 * Model SEO Page Types
 *
 * Type definitions for the model-specific SEO landing pages.
 * Each model gets up to 3 pages: create, edit, and features.
 * These types drive the polymorphic shell components in components/models/.
 */

import type { ModelDefinition } from "@/lib/config/models";
import type { ModelPageCategory } from "@/lib/models/model-seo-slugs";

// ============================================================================
// Page Categories
// ============================================================================

/**
 * Re-export ModelPageCategory from the canonical source of truth.
 * All slug data, display names, and category assignments live in model-seo-slugs.ts.
 */
export type { ModelPageCategory } from "@/lib/models/model-seo-slugs";

/** Display metadata for each category */
export const MODEL_PAGE_CATEGORIES: Record<
  ModelPageCategory,
  { label: string; description: string }
> = {
  create: {
    label: "Create",
    description: "Generate new images and content",
  },
  edit: {
    label: "Edit",
    description: "Refine and transform existing images",
  },
  features: {
    label: "Features",
    description: "Model specifications and capabilities",
  },
} as const;

// ============================================================================
// Model SEO Configuration
// ============================================================================

/** Provider metadata for structured data and UI badges */
export interface ModelProvider {
  /** Provider display name (e.g., "Black Forest Labs", "Google", "OpenAI") */
  readonly name: string;
  /** Provider website URL */
  readonly url: string;
}

/** SEO-specific configuration layered on top of ModelDefinition */
export interface ModelSEOConfig {
  /** Model ID — matches key in MODEL_REGISTRY */
  readonly modelId: string;
  /** SEO-optimized display name (may differ from registry displayName) */
  readonly displayName: string;
  /** URL slug for routing (e.g., "flux-schnell", "gpt-image") */
  readonly slug: string;
  /** Provider metadata */
  readonly provider: ModelProvider;
  /** Which page categories this model supports */
  readonly categories: readonly ModelPageCategory[];
  /** Reference to the underlying model definition */
  readonly modelDefinition: ModelDefinition;
}

// ============================================================================
// Page Content
// ============================================================================

/** Hero section content — varies per category */
export interface ModelHeroContent {
  /** Large H1 heading */
  readonly title: string;
  /** Subtitle below H1 */
  readonly subtitle: string;
  /** Extended description paragraph */
  readonly description: string;
  /** CTA button text */
  readonly ctaText: string;
  /** CTA button link (defaults to /studio) */
  readonly ctaHref?: string;
}

/** Feature card for use in feature grids */
export interface ModelFeatureCard {
  readonly title: string;
  readonly description: string;
  /** Optional icon name (lucide) */
  readonly icon?: string;
}

/** FAQ item for structured data + display */
export interface ModelFAQItem {
  readonly question: string;
  readonly answer: string;
}

/** Complete page content for a single model + category combination */
export interface ModelPageContent {
  /** Hero section */
  readonly hero: ModelHeroContent;
  /** Feature cards displayed in the main content area */
  readonly features: readonly ModelFeatureCard[];
  /** FAQ items for the page */
  readonly faqs: readonly ModelFAQItem[];
  /** SEO meta title */
  readonly metaTitle: string;
  /** SEO meta description */
  readonly metaDescription: string;
}
