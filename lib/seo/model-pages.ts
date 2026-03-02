/**
 * Model SEO Page Configurations
 *
 * Content layer for all model × category SEO pages.
 * Derives model configs from the single source of truth in model-seo-slugs.ts,
 * then generates page content for the create/edit/features categories.
 */

import { MODEL_REGISTRY, type ModelDefinition } from "@/lib/config/models";
import { MODEL_SEO_SLUGS } from "@/lib/models/model-seo-slugs";
import type {
  ModelSEOConfig,
  ModelPageCategory,
  ModelPageContent,
  ModelHeroContent,
  ModelFeatureCard,
  ModelFAQItem,
  ModelProvider,
} from "@/lib/models/types";

// ============================================================================
// Provider Registry
// ============================================================================

const PROVIDERS: Record<string, ModelProvider> = {
  bfl: { name: "Black Forest Labs", url: "https://blackforestlabs.ai" },
  google: { name: "Google", url: "https://deepmind.google" },
  openai: { name: "OpenAI", url: "https://openai.com" },
  bytedance: { name: "ByteDance", url: "https://bytedance.com" },
  stability: { name: "Stability AI", url: "https://stability.ai" },
  alibaba: { name: "Alibaba", url: "https://alibaba.com" },
  xai: { name: "xAI", url: "https://x.ai" },
} as const;

// ============================================================================
// Model → Provider Mapping
// ============================================================================

/**
 * Resolve a provider for a MODEL_REGISTRY entry based on its logo path.
 * This avoids duplicating provider assignments across registries.
 */
const LOGO_TO_PROVIDER: Record<string, ModelProvider> = {
  "/image-models/flux.svg": PROVIDERS.bfl,
  "/image-models/openai.svg": PROVIDERS.openai,
  "/image-models/google.svg": PROVIDERS.google,
  "/image-models/bytedance.svg": PROVIDERS.bytedance,
  "/image-models/stability.svg": PROVIDERS.stability,
  "/image-models/alibaba.svg": PROVIDERS.alibaba,
  "/image-models/xai.svg": PROVIDERS.xai,
};

function resolveProvider(modelDef: ModelDefinition): ModelProvider {
  if (modelDef.logo) {
    const provider = LOGO_TO_PROVIDER[modelDef.logo];
    if (provider) return provider;
  }
  // Fallback — should never hit if MODEL_REGISTRY logos are set correctly
  return { name: "Unknown", url: "" };
}

// ============================================================================
// Build SEO Configs (derived from MODEL_SEO_SLUGS — single source of truth)
// ============================================================================

function buildSEOConfigs(): ModelSEOConfig[] {
  const configs: ModelSEOConfig[] = [];

  for (const entry of MODEL_SEO_SLUGS) {
    const modelDef = MODEL_REGISTRY[entry.modelId];
    if (!modelDef) continue;

    configs.push({
      modelId: entry.modelId,
      displayName: entry.displayName,
      slug: entry.slug,
      provider: resolveProvider(modelDef),
      categories: entry.categories,
      modelDefinition: modelDef,
    });
  }

  return configs;
}

/** All model SEO configurations */
export const ALL_MODEL_SEO_CONFIGS: ModelSEOConfig[] = buildSEOConfigs();

/** Lookup by slug for O(1) access in page routes */
const SLUG_INDEX = new Map<string, ModelSEOConfig>();
for (const config of ALL_MODEL_SEO_CONFIGS) {
  SLUG_INDEX.set(config.slug, config);
}

/**
 * Get a model SEO config by URL slug.
 * Returns undefined if the slug doesn't match any model.
 */
export function getModelSEOConfig(slug: string): ModelSEOConfig | undefined {
  return SLUG_INDEX.get(slug);
}

// ============================================================================
// Page Content Generation
// ============================================================================

/** Generate the hero content for a model + category */
function generateHero(config: ModelSEOConfig, category: ModelPageCategory): ModelHeroContent {
  const { displayName, modelDefinition } = config;
  const isVideo = modelDefinition.type === "video";
  const media = isVideo ? "videos" : "images";

  switch (category) {
    case "create":
      return {
        title: `Create with ${displayName}`,
        subtitle: isVideo
          ? `Generate stunning AI videos with ${displayName}`
          : `Generate stunning AI images with ${displayName}`,
        description: modelDefinition.description,
        ctaText: `Try ${displayName}`,
        ctaHref: "/studio",
      };
    case "edit":
      return {
        title: `Edit with ${displayName}`,
        subtitle: `Refine and transform your ${media} using ${displayName}`,
        description: `Use ${displayName} to make precise edits, style transfers, and creative adjustments to your existing ${media}. Powered by ${config.provider.name}.`,
        ctaText: `Edit with ${displayName}`,
        ctaHref: "/studio",
      };
    case "features":
      return {
        title: `${displayName} Features`,
        subtitle: `Technical specifications and capabilities of ${displayName}`,
        description: `Explore the full technical specs, supported resolutions, and unique capabilities of ${displayName} by ${config.provider.name}.`,
        ctaText: "View All Models",
        ctaHref: "/models",
      };
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

/** Generate feature cards for a model + category */
function generateFeatures(config: ModelSEOConfig, category: ModelPageCategory): ModelFeatureCard[] {
  const { displayName, modelDefinition } = config;
  const isVideo = modelDefinition.type === "video";

  const baseFeatures: ModelFeatureCard[] = [];

  // Resolution feature
  const maxDim = modelDefinition.constraints.maxDimension;
  if (maxDim && maxDim !== Number.POSITIVE_INFINITY) {
    baseFeatures.push({
      title: isVideo ? "HD Video Output" : `Up to ${maxDim}px`,
      description: isVideo
        ? `Generate high-definition ${modelDefinition.durationConstraints ? `${modelDefinition.durationConstraints.min}-${modelDefinition.durationConstraints.max}s` : ""} video clips.`
        : `Create ${mediaType(modelDefinition)} at resolutions up to ${maxDim} pixels on the longest side.`,
      icon: "maximize",
    });
  }

  // Aspect ratio feature
  const ratioCount = modelDefinition.aspectRatios.length;
  baseFeatures.push({
    title: `${ratioCount} Aspect Ratios`,
    description: `Choose from ${ratioCount} preset aspect ratios including square, portrait, landscape, and ultrawide formats.`,
    icon: "layout",
  });

  // Provider feature
  baseFeatures.push({
    title: `By ${config.provider.name}`,
    description: `Built by ${config.provider.name}. ${displayName} represents ${isVideo ? "cutting-edge video generation" : "state-of-the-art image synthesis"} technology.`,
    icon: "building",
  });

  if (category === "create") {
    baseFeatures.push({
      title: "Prompt Enhancement",
      description: `Bloom Studio's intelligent prompt system optimizes your input for ${displayName}, producing better results with less effort.`,
      icon: "wand",
    });
  }

  if (category === "edit" && modelDefinition.supportsReferenceImage) {
    baseFeatures.push({
      title: "Reference Image Input",
      description: `Upload an existing image and use ${displayName} to apply transformations, style transfers, and targeted edits.`,
      icon: "image-plus",
    });
  }

  if (category === "features") {
    if (modelDefinition.supportsNegativePrompt) {
      baseFeatures.push({
        title: "Negative Prompts",
        description: "Fine-tune outputs by specifying what you don't want in the generated result.",
        icon: "minus-circle",
      });
    }
    if (modelDefinition.supportsReferenceImage) {
      baseFeatures.push({
        title: "Image-to-Image",
        description: "Upload a reference image and generate variations or edits based on it.",
        icon: "image-plus",
      });
    }
    if (isVideo && modelDefinition.supportsAudio) {
      baseFeatures.push({
        title: "Native Audio",
        description: "Generate videos with synchronized audio output — no separate audio step needed.",
        icon: "volume-2",
      });
    }
  }

  return baseFeatures;
}

function mediaType(def: ModelDefinition): string {
  return def.type === "video" ? "videos" : "images";
}

/** Generate FAQ items for a model + category */
function generateFAQs(config: ModelSEOConfig, category: ModelPageCategory): ModelFAQItem[] {
  const { displayName, modelDefinition } = config;
  const isVideo = modelDefinition.type === "video";

  const faqs: ModelFAQItem[] = [
    {
      question: `What is ${displayName}?`,
      answer: `${displayName} is ${isVideo ? "a video generation" : "an image generation"} AI model by ${config.provider.name}. ${modelDefinition.description}`,
    },
    {
      question: `Is ${displayName} free to use on Bloom Studio?`,
      answer: `Yes! Bloom Studio offers a 24-hour free trial with full access to ${displayName} and all other models. After that, plans start at just $3/month.`,
    },
  ];

  if (category === "create") {
    faqs.push({
      question: `How do I get the best results with ${displayName}?`,
      answer: `Write detailed, descriptive prompts. Bloom Studio's prompt enhancement engine automatically optimizes your input for ${displayName}. Experiment with different aspect ratios and settings to find what works best for your use case.`,
    });
  }

  if (category === "edit" && modelDefinition.supportsReferenceImage) {
    faqs.push({
      question: `Can I upload my own images to edit with ${displayName}?`,
      answer: `Yes. ${displayName} supports reference image input, allowing you to upload your own images and apply AI-powered edits, style transfers, and creative adjustments.`,
    });
  }

  if (category === "features") {
    const maxDim = modelDefinition.constraints.maxDimension;
    if (maxDim && maxDim !== Number.POSITIVE_INFINITY) {
      faqs.push({
        question: `What is the maximum resolution for ${displayName}?`,
        answer: `${displayName} supports output up to ${maxDim}px on the longest side. Multiple aspect ratios are available including square, portrait, and landscape formats.`,
      });
    }
  }

  faqs.push({
    question: "Do I own the images I generate?",
    answer: "Yes. You retain full rights to all content you generate on Bloom Studio. Use it for personal projects, commercial work, or anything else.",
  });

  if (modelDefinition.isLegacy) {
    faqs.push({
      question: `Is ${displayName} still available?`,
      answer: `${displayName} is currently a legacy model on Bloom Studio. While it may not be available for new generations, your previously generated content is still accessible. Check our active model lineup for the latest alternatives.`,
    });
  }

  return faqs;
}

/** Generate SEO meta title for a model + category */
function generateMetaTitle(config: ModelSEOConfig, category: ModelPageCategory): string {
  const { displayName } = config;
  switch (category) {
    case "create":
      return `${displayName} — Free AI ${config.modelDefinition.type === "video" ? "Video" : "Image"} Generator`;
    case "edit":
      return `${displayName} — AI Image Editor`;
    case "features":
      return `${displayName} — Features & Specs`;
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

/** Generate SEO meta description for a model + category */
function generateMetaDescription(config: ModelSEOConfig, category: ModelPageCategory): string {
  const { displayName, modelDefinition } = config;
  switch (category) {
    case "create":
      return `Generate stunning AI ${modelDefinition.type === "video" ? "videos" : "images"} with ${displayName} by ${config.provider.name}. ${modelDefinition.description} Try free on Bloom Studio.`;
    case "edit":
      return `Edit and transform your images with ${displayName}. Apply AI-powered edits, style transfers, and creative adjustments. Try free on Bloom Studio.`;
    case "features":
      return `Explore ${displayName} technical specs: resolutions, aspect ratios, and capabilities. Compare with other models on Bloom Studio.`;
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

/**
 * Generate complete page content for a model + category combination.
 */
export function getModelPageContent(
  config: ModelSEOConfig,
  category: ModelPageCategory
): ModelPageContent {
  return {
    hero: generateHero(config, category),
    features: generateFeatures(config, category),
    faqs: generateFAQs(config, category),
    metaTitle: generateMetaTitle(config, category),
    metaDescription: generateMetaDescription(config, category),
  };
}

// ============================================================================
// Static Params Generation
// ============================================================================

/** All valid {slug, category} combinations for generateStaticParams */
export function getAllModelPageParams(): Array<{ slug: string; category: string }> {
  const params: Array<{ slug: string; category: string }> = [];

  for (const config of ALL_MODEL_SEO_CONFIGS) {
    for (const category of config.categories) {
      params.push({ slug: config.slug, category });
    }
  }

  return params;
}

/**
 * Default steps for how-to sections. Varies by model type.
 */
export function getModelSteps(
  config: ModelSEOConfig,
  category: ModelPageCategory
): Array<{ title: string; description: string }> {
  const { displayName, modelDefinition } = config;
  const isVideo = modelDefinition.type === "video";

  if (category === "edit") {
    return [
      { title: "Upload your image", description: "Select an existing image to use as a reference or starting point." },
      { title: "Describe your edits", description: `Tell ${displayName} what changes you want — style transfer, color correction, object addition, and more.` },
      { title: "Generate & compare", description: "Review the edited result side-by-side with your original and iterate until perfect." },
    ];
  }

  if (isVideo) {
    return [
      { title: "Write your scene", description: "Describe the action, environment, and mood of the video you want to create." },
      { title: `Select ${displayName}`, description: `Choose ${displayName} from our model selector and configure duration and aspect ratio.` },
      { title: "Generate your clip", description: "Watch as your scene comes to life in a high-quality video file." },
    ];
  }

  return [
    { title: "Enter your prompt", description: "Describe the image you want to create in natural language." },
    { title: `Select ${displayName}`, description: `Choose ${displayName} from the model selector and pick your preferred aspect ratio.` },
    { title: "Generate & refine", description: "Review your result and iterate on the prompt to perfect the output." },
  ];
}
