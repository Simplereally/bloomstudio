import type { Solution } from "../solution-types";

export const AI_ART_GENERATOR: Solution = {
  title: "AI Art Generator",
  shortTitle: "Art",
  slug: "ai-art-generator",
  description:
    "Transform your artistic visions into beautiful digital pieces. Experiment with countless art styles through a unified, fast, and intuitive interface.",
  heroSuffix: "art",
  heroImages: [
    "/solutions/ai-art-generator/hero-1.jpg",
    "/solutions/ai-art-generator/hero-2.jpg",
    "/solutions/ai-art-generator/hero-3.jpg",
    "/solutions/ai-art-generator/hero-4.jpg",
  ],
  features: [
    {
      title: "Infinite Styles",
      description:
        "Explore styles ranging from classical oil paintings and watercolors to modern digital concept art and pixel-perfect illustrations.",
      image: "/solutions/ai-art-generator/feature-1.jpg",
    },
    {
      title: "Character & World Building",
      description: "Rapidly iterate on character designs, environment silhouettes, and color scripts for your creative projects.",
      image: "/solutions/ai-art-generator/feature-2.jpg",
    },
    {
      title: "Creative Brainstorming",
      description:
        "Use AI as a collaborative partner to overcome creative block, exploring compositions and lighting schemes in real-time.",
      image: "/solutions/ai-art-generator/feature-3.jpg",
    },
  ],
  steps: [
    {
      title: "Describe your vision",
      description: "Specify the medium (oil, digital, sketch) and the subject of your artwork.",
    },
    {
      title: "Select Art Constraints",
      description: "Choose aspect ratios and resolution tiers that suit your intended final format.",
    },
    {
      title: "Generate Masterpieces",
      description: "Create high-resolution artwork suitable for digital sharing or large-format printing.",
    },
  ],
  faqs: [
    {
      question: "Can I emulate specific artists?",
      answer: "You can describe specific artistic styles and eras to guide the AI's aesthetic output.",
    },
    {
      question: "What is the max resolution?",
      answer: "We support high-resolution outputs up to 4K, perfect for high-quality art prints.",
    },
  ],
  showcase: [
    { label: "Oil Painting Portrait", aspectRatio: "landscape", className: "h-full", src: "/solutions/ai-art-generator/showcase-1.jpg" },
    { label: "Impressionist Terrace", aspectRatio: "landscape", className: "h-full", src: "/solutions/ai-art-generator/showcase-2.jpg" },
    { label: "Digital Concept Art", aspectRatio: "landscape", className: "h-full", src: "/solutions/ai-art-generator/showcase-3.jpg" },
    { label: "Modern Abstract Wall", aspectRatio: "landscape", className: "h-full", src: "/solutions/ai-art-generator/showcase-4.jpg" },
    { label: "Sci-Fi Illustration", aspectRatio: "landscape", className: "h-full", src: "/solutions/ai-art-generator/showcase-5.jpg" },
  ],
};
