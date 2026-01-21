import type { Solution } from "../solution-types";

export const AI_PRINT_ON_DEMAND: Solution = {
  title: "AI Print on Demand",
  shortTitle: "Print Designs",
  slug: "ai-print-on-demand",
  description:
    "Create unique, high-resolution designs ready for your merchandise business. Perfect for t-shirts, posters, and product prints.",
  heroSuffix: "prints",
  heroImages: [
    "/solutions/ai-print-generator/hero-1.jpg",
    "/solutions/ai-print-generator/hero-2.jpg",
    "/solutions/ai-print-generator/hero-3.jpg",
    "/solutions/ai-print-generator/hero-4.jpg",
  ],
  features: [
    {
      title: "Merchandise Concepts",
      description:
        "Create stunning visuals specifically for apparel, home decor, and accessories. Experience how your designs will look on physical products.",
      image: "/solutions/ai-print-generator/feature-1.jpg",
    },
    {
      title: "High-Resolution Output",
      description:
        "Get the detail you need for crisp physical prints. Our models support high pixel counts suitable for large-format products.",
      image: "/solutions/ai-print-generator/feature-2.jpg",
    },
    {
      title: "Scaling Your Store",
      description: "Rapidly fill your print-on-demand store with diverse designs for any niche, trend, or holiday in minutes.",
      image: "/solutions/ai-print-generator/feature-3.jpg",
    },
  ],
  steps: [
    {
      title: "Find your niche",
      description: "Describe the theme or audience you want to target with your merchandise.",
    },
    {
      title: "Generate Bulk Options",
      description: "Create a wide array of design variants to see what will sell best in your store.",
    },
    {
      title: "Download for Print",
      description: "Export high-quality images ready to be uploaded to your favorite POD platform.",
    },
  ],
  faqs: [
    {
      question: "What is the max resolution?",
      answer: "We support high-resolution outputs up to 4K, which is the industry standard for high-quality printing.",
    },
    {
      question: "Can I sell the products?",
      answer: "Absolutely. You own the rights to the designs you generate and can use them on commercial merchandise.",
    },
  ],
  showcase: [
    {
      label: "T-Shirt Graphic Design",
      aspectRatio: "square",
      className: "h-full md:aspect-[1/2]",
      src: "/solutions/ai-print-generator/showcase-1.jpg",
    },
    {
      label: "Mug & Product Print",
      aspectRatio: "landscape-wide",
      className: "h-full",
      src: "/solutions/ai-print-generator/showcase-2.jpg",
    },
    { label: "Poster Art Print", aspectRatio: "square", className: "h-full", src: "/solutions/ai-print-generator/showcase-3.jpg" },
    {
      label: "Repeat Pattern Merch",
      aspectRatio: "landscape-wide",
      className: "h-full",
      src: "/solutions/ai-print-generator/showcase-4.jpg",
    },
    { label: "Sticker Pack Elements", aspectRatio: "square", className: "h-full", src: "/solutions/ai-print-generator/showcase-5.jpg" },
  ],
};
