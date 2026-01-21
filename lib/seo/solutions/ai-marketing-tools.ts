import type { Solution } from "../solution-types";

export const AI_MARKETING_TOOLS: Solution = {
  title: "AI Marketing Tools",
  shortTitle: "Marketing Assets",
  slug: "ai-marketing-tools",
  description:
    "Scale your content production with AI-generated ad creatives and social media visuals. Explore campaign ideas and brand assets in seconds.",
  heroSuffix: "marketing assets",
  heroImages: [
    "/solutions/ai-marketing-tools/hero-1.jpg",
    "/solutions/ai-marketing-tools/hero-2.jpg",
    "/solutions/ai-marketing-tools/hero-3.jpg",
    "/solutions/ai-marketing-tools/hero-4.jpg",
  ],
  features: [
    {
      title: "Creative Exploration",
      description:
        "Rapidly generate dozens of visual variations for your ad campaigns. Explore different compositions and styles to find what resonates.",
      image: "/solutions/ai-marketing-tools/feature-1.jpg",
    },
    {
      title: "Social Media Graphics",
      description:
        "Create eye-catching visuals for Instagram, Facebook, and LinkedIn. Tailor your imagery to specific platforms with custom aspect ratios.",
      image: "/solutions/ai-marketing-tools/feature-2.jpg",
    },
    {
      title: "Marketing Campaign Concepts",
      description:
        "Visualize brand directions and campaign themes before starting full production. Align stakeholders with high-quality visual references.",
      image: "/solutions/ai-marketing-tools/feature-3.jpg",
    },
  ],
  steps: [
    {
      title: "Define your audience",
      description: "Describe the vibe and visual style that appeals to your target demographic.",
    },
    {
      title: "Generate Visual Options",
      description: "Use our prompt enhancer to create a diverse batch of marketing-ready concepts.",
    },
    {
      title: "Download & Deploy",
      description: "Select the most promising visuals and incorporate them into your marketing workflow.",
    },
  ],
  faqs: [
    {
      question: "Can I use these for ads?",
      answer: "Yes, you have full commercial rights. We recommend adding your specific logo and copy in a design tool.",
    },
    {
      question: "Does it support text?",
      answer:
        "While newer models are better at text, we suggest using our AI for the visual backdrop and adding copy separately for maximum clarity.",
    },
  ],
  showcase: [
    {
      label: "Instagram Ad Creative",
      aspectRatio: "square",
      className: "h-full md:aspect-[1/2]",
      src: "/solutions/ai-marketing-tools/showcase-1.jpg",
    },
    {
      label: "Facebook Banner Ad",
      aspectRatio: "landscape-wide",
      className: "h-full",
      src: "/solutions/ai-marketing-tools/showcase-2.jpg",
    },
    { label: "Product Marketing Shot", aspectRatio: "square", className: "h-full", src: "/solutions/ai-marketing-tools/showcase-3.jpg" },
    {
      label: "Hero Website Image",
      aspectRatio: "landscape-wide",
      className: "h-full",
      src: "/solutions/ai-marketing-tools/showcase-4.jpg",
    },
    { label: "Brand Pattern Design", aspectRatio: "square", className: "h-full", src: "/solutions/ai-marketing-tools/showcase-5.jpg" },
  ],
};
