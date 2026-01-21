import type { Solution } from "../solution-types";

export const AI_GRAPHIC_DESIGN: Solution = {
  title: "AI Graphic Design",
  shortTitle: "Graphic Design",
  slug: "ai-graphic-design",
  description:
    "Generate professional-grade graphic design elements and layout concepts. From logos and icons to brand patterns, explore your design ideas instantly.",
  heroSuffix: "designs",
  heroImages: [
    "/solutions/ai-graphic-design/hero-1.jpg",
    "/solutions/ai-graphic-design/hero-2.jpg",
    "/solutions/ai-graphic-design/hero-3.jpg",
    "/solutions/ai-graphic-design/hero-4.jpg",
  ],
  features: [
    {
      title: "Logo & Brand Ideation",
      description:
        "Brainstorm and visualize hundreds of logo and icon ideas in seconds. Explore various shapes, symbols, and typographic treatments to kickstart your project.",
      image: "/solutions/ai-graphic-design/feature-1.jpg",
    },
    {
      title: "Cohesive Iconography",
      description:
        "Generate sets of icons with consistent line weights and styles. Maintain a unified visual language across your entire app or website project.",
      image: "/solutions/ai-graphic-design/feature-2.jpg",
    },
    {
      title: "Pattern Exploration",
      description:
        "Create unique brand patterns and background elements. Experiment with different colors and geometries to build a comprehensive visual identity.",
      image: "/solutions/ai-graphic-design/feature-3.jpg",
    },
  ],
  steps: [
    {
      title: "Define the brief",
      description: "Describe the element you want to create, including style, mood, and color palette.",
    },
    {
      title: "Explore Variations",
      description: "Generate multiple design concepts to see which direction works best for your brand.",
    },
    {
      title: "Incorporate & Finalize",
      description: "Download your favorites and use them as the foundation for your final design work.",
    },
  ],
  faqs: [
    {
      question: "Do you provide vector files?",
      answer:
        "We provide high-resolution raster images (PNG/JPG) which can be easily vectorized in tools like Adobe Illustrator or Figma.",
    },
    {
      question: "Are the designs unique?",
      answer: "Yes, every design is generated from scratch based on your unique prompt and the specific model you choose.",
    },
  ],
  showcase: [
    { label: "Minimalist Logo Mark", aspectRatio: "landscape", className: "h-full", src: "/solutions/ai-graphic-design/showcase-1.jpg" },
    { label: "Custom Icon Set", aspectRatio: "landscape", className: "h-full", src: "/solutions/ai-graphic-design/showcase-2.jpg" },
    {
      label: "Branding Guidelines Visual",
      aspectRatio: "landscape",
      className: "h-full",
      src: "/solutions/ai-graphic-design/showcase-3.jpg",
    },
    {
      label: "Vector Style Illustration",
      aspectRatio: "landscape",
      className: "h-full",
      src: "/solutions/ai-graphic-design/showcase-4.jpg",
    },
    {
      label: "Typographic Badge concept",
      aspectRatio: "landscape",
      className: "h-full",
      src: "/solutions/ai-graphic-design/showcase-5.jpg",
    },
  ],
};
