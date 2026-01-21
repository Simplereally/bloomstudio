import type { Solution } from "../solution-types";

export const AI_BLUEPRINTS: Solution = {
  title: "AI Blueprints",
  shortTitle: "Blueprints",
  slug: "blueprints",
  description:
    "Generate architectural visualizations and schematic-style concepts instantly with AI. Explore floor plan layouts and technical aesthetics for early-stage planning.",
  heroSuffix: "blueprints",
  heroImages: [
    "/solutions/ai-blueprints/hero-1.jpg",
    "/solutions/ai-blueprints/hero-2.jpg",
    "/solutions/ai-blueprints/hero-3.jpg",
    "/solutions/ai-blueprints/hero-4.jpg",
  ],
  features: [
    {
      title: "Visual Schematics",
      description:
        "Transform textual descriptions into clear architectural visualizations. Our prompt enhancement engine helps you explore room layouts and functional zones through high-quality renders.",
      image: "/solutions/ai-blueprints/feature-1.jpg",
    },
    {
      title: "Drafting Aesthetics",
      description:
        "Emulate the look and feel of professional drafting standards. Whether you need an ANSI or ISO schematic aesthetic, our models capture the technical style for your presentations.",
      image: "/solutions/ai-blueprints/feature-2.jpg",
    },
    {
      title: "Rapid Layout Iteration",
      description:
        "Generate dozens of layout variations for your project in minutes. Perfect for early-stage conceptualization and spatial flow studies before CAD drafting.",
      image: "/solutions/ai-blueprints/feature-3.jpg",
    },
  ],
  steps: [
    {
      title: "Describe your concept",
      description: "Enter a description of the space, building, or layout you want to explore.",
    },
    {
      title: "AI-Enhanced Generation",
      description: "Our platform optimizes your prompt to ensure a detailed, technical-looking visual output.",
    },
    {
      title: "Iterate & Refine",
      description: "Fine-tune your descriptions to explore different materials, lighting, or spatial arrangements.",
    },
  ],
  faqs: [
    {
      question: "Can I use these for construction?",
      answer:
        "No, these are AI-generated visualizations for conceptualization. Always consult with a licensed architect for actual construction documents.",
    },
    {
      question: "What is the output format?",
      answer: "You can download high-resolution image files (PNG/JPG) of your generated concepts.",
    },
  ],
  showcase: [
    { label: "Modern Floor Plan Concept", aspectRatio: "landscape", className: "h-full", src: "/solutions/ai-blueprints/showcase-1.jpg" },
    {
      label: "Technical Style Cross-section",
      aspectRatio: "landscape",
      className: "h-full",
      src: "/solutions/ai-blueprints/showcase-2.jpg",
    },
    {
      label: "Electrical Schematic Aesthetic",
      aspectRatio: "landscape",
      className: "h-full",
      src: "/solutions/ai-blueprints/showcase-3.jpg",
    },
    { label: "Site Layout Visualization", aspectRatio: "landscape", className: "h-full", src: "/solutions/ai-blueprints/showcase-4.jpg" },
    { label: "3D Massing Study Render", aspectRatio: "landscape", className: "h-full", src: "/solutions/ai-blueprints/showcase-5.jpg" },
  ],
};
