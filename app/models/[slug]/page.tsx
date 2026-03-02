import { permanentRedirect } from "next/navigation";
import { getModelSEOConfig, ALL_MODEL_SEO_CONFIGS } from "@/lib/seo/model-pages";
import { notFound } from "next/navigation";

// ============================================================================
// Static Params
// ============================================================================

export function generateStaticParams() {
  return ALL_MODEL_SEO_CONFIGS.map((config) => ({
    slug: config.slug,
  }));
}

// ============================================================================
// Page — 308 Redirect to /models/[slug]/create
// ============================================================================

/**
 * /models/[slug] permanently redirects to /models/[slug]/create.
 *
 * Uses a 308 (Permanent Redirect, preserving method) so search engines
 * consolidate link equity on the canonical /create page.
 */
export default async function ModelSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = getModelSEOConfig(slug);

  if (!config) {
    return notFound();
  }

  permanentRedirect(`/models/${slug}/create`);
}
