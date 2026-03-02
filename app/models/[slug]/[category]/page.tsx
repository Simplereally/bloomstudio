import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { SoftwareApplication, Product, WithContext } from "schema-dts";

import { JsonLd } from "@/components/seo/json-ld";
import { ModelPageShell } from "@/components/models/model-page-shell";
import { ModelBreadcrumbs } from "@/components/models/model-breadcrumbs";
import { ModelCategoryNav } from "@/components/models/model-category-nav";
import { ModelHero } from "@/components/models/model-hero";
import { ModelShowcase } from "@/components/models/model-showcase";
import { ModelSpecsTable } from "@/components/models/model-specs-table";
import { ModelComparison } from "@/components/models/model-comparison";
import { ModelCapabilities } from "@/components/models/model-capabilities";
import { ModelSteps } from "@/components/models/model-steps";
import { ModelInternalLinks } from "@/components/models/model-internal-links";
import { ModelFAQ } from "@/components/models/model-faq";
import { ModelCTABanner } from "@/components/models/model-cta-banner";

import {
  getModelSEOConfig,
  getModelPageContent,
  getAllModelPageParams,
  getModelSteps,
} from "@/lib/seo/model-pages";
import type { ModelPageCategory } from "@/lib/models/types";

// ============================================================================
// Validation
// ============================================================================

const VALID_CATEGORIES = new Set<string>(["create", "edit", "features"]);

function isValidCategory(value: string): value is ModelPageCategory {
  return VALID_CATEGORIES.has(value);
}

// ============================================================================
// Static Params
// ============================================================================

export function generateStaticParams() {
  return getAllModelPageParams();
}

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; category: string }>;
}): Promise<Metadata> {
  const { slug, category } = await params;

  if (!isValidCategory(category)) {
    return { title: "Not Found | Bloom Studio" };
  }

  const config = getModelSEOConfig(slug);
  if (!config || !config.categories.includes(category)) {
    return { title: "Not Found | Bloom Studio" };
  }

  const content = getModelPageContent(config, category);

  return {
    title: `${content.metaTitle} | Bloom Studio`,
    description: content.metaDescription,
    alternates: {
      canonical: `/models/${slug}/${category}`,
    },
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      url: `https://bloomstudio.fun/models/${slug}/${category}`,
      siteName: "Bloom Studio",
      type: "website",
      images: [
        {
          url: `/image-models/${config.modelId}.svg`,
          width: 1200,
          height: 630,
          alt: `${config.displayName} on Bloom Studio`,
        },
      ],
    },
  };
}

// ============================================================================
// Structured Data Builders
// ============================================================================

/**
 * Build SoftwareApplication schema for create/edit pages.
 * These pages showcase a tool for generating/editing media.
 */
function buildSoftwareApplicationSchema(
  config: ReturnType<typeof getModelSEOConfig> & object,
  category: ModelPageCategory
): WithContext<SoftwareApplication> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${config.displayName} — ${category === "create" ? "AI Generator" : "AI Editor"}`,
    description: config.modelDefinition.description,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    url: `https://bloomstudio.fun/models/${config.slug}/${category}`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "24-hour free trial, then from $3/month",
    },
    creator: {
      "@type": "Organization",
      name: config.provider.name,
      url: config.provider.url,
    },
    provider: {
      "@type": "Organization",
      name: "Bloom Studio",
      url: "https://bloomstudio.fun",
    },
  };
}

/**
 * Build Product schema for features pages.
 * These pages describe the model as a product with technical specs.
 */
function buildProductSchema(
  config: ReturnType<typeof getModelSEOConfig> & object
): WithContext<Product> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: config.displayName,
    description: config.modelDefinition.description,
    image: config.modelDefinition.logo || `/image-models/${config.modelId}.svg`,
    brand: {
      "@type": "Brand",
      name: config.provider.name,
    },
    url: `https://bloomstudio.fun/models/${config.slug}/features`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      description: "24-hour free trial, then from $3/month",
    },
  };
}

// ============================================================================
// Page Component
// ============================================================================

export default async function ModelCategoryPage({
  params,
}: {
  params: Promise<{ slug: string; category: string }>;
}) {
  const { slug, category } = await params;

  // Validate category
  if (!isValidCategory(category)) {
    return notFound();
  }

  // Resolve config
  const config = getModelSEOConfig(slug);
  if (!config) {
    return notFound();
  }

  // Validate this model supports the requested category
  if (!config.categories.includes(category)) {
    return notFound();
  }

  // Generate page content
  const content = getModelPageContent(config, category);
  const steps = getModelSteps(config, category);

  // Determine showcase variant
  const showcaseVariant = category === "edit" ? "before-after" : "gallery";

  return (
    <ModelPageShell>
      {/* Structured Data: Primary Schema */}
      {category === "features" ? (
        <JsonLd data={buildProductSchema(config)} />
      ) : (
        <JsonLd data={buildSoftwareApplicationSchema(config, category)} />
      )}

      {/* Breadcrumbs (includes BreadcrumbList JSON-LD) */}
      <ModelBreadcrumbs model={config} category={category} />

      {/* Category Navigation Tabs */}
      <ModelCategoryNav model={config} activeCategory={category} />

      {/* Hero Section */}
      <ModelHero content={content} model={config} />

      {/* Category-Specific Sections */}
      {(category === "create" || category === "edit") && (
        <ModelShowcase model={config} variant={showcaseVariant} />
      )}

      {category === "features" && (
        <>
          <ModelSpecsTable model={config} />
          <ModelComparison currentModel={config} />
        </>
      )}

      {/* Shared Sections */}
      <ModelCapabilities
        features={content.features}
        heading={
          category === "features"
            ? `${config.displayName} Capabilities`
            : "Key Features"
        }
        subheading={
          category === "features"
            ? `What makes ${config.displayName} stand out.`
            : `Why creators choose ${config.displayName}.`
        }
      />

      <ModelSteps
        steps={steps}
        heading={
          category === "edit"
            ? `How to Edit with ${config.displayName}`
            : `How to Use ${config.displayName}`
        }
        subheading={
          category === "edit"
            ? "Upload, describe, and refine in three steps."
            : "Three simple steps to start generating."
        }
      />

      {/* Internal Cross-Links */}
      <ModelInternalLinks
        currentModel={config}
        currentCategory={category}
      />

      {/* FAQ (includes FAQPage JSON-LD) */}
      <ModelFAQ faqs={content.faqs} model={config} />

      {/* CTA Banner */}
      <ModelCTABanner category={category} model={config} />
    </ModelPageShell>
  );
}
