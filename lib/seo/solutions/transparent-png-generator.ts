import type { Solution } from "../solution-types";

export const TRANSPARENT_PNG_GENERATOR: Solution = {
  title: "Transparent PNG Generator",
  shortTitle: "Transparent PNGs",
  slug: "transparent-png-generator",
  description:
    "Generate high-quality images with alpha-channel transparency instantly. Perfect for game assets, stickers, and professional graphic design.",
  heroSuffix: "assets",
  heroImages: [
    "/solutions/transparent-generator/hero-1.png",
    "/solutions/transparent-generator/hero-2.png",
    "/solutions/transparent-generator/hero-3.png",
  ],
  features: [
    {
      title: "Complex Subject Isolation",
      description:
        "Achieve flawless masking for difficult subjects like fur, hair, and foliage. Our AI ensures every detail is perfectly cut out for professional use.",
      image: "/solutions/transparent-generator/feature-1.png",
    },
    {
      title: "Modular Game Assets",
      description:
        "Generate consistent, high-quality isometric assets and sprites for your games. Ready to be used as isolated elements in any engine.",
      image: "/solutions/transparent-generator/feature-2.png",
    },
    {
      title: "Glassmorphism UI Kit",
      description:
        "Create modern UI elements with realistic transparency and glassmorphism effects. Perfect for landing pages and app interfaces.",
      image: "/solutions/transparent-generator/feature-3.png",
    },
  ],
  steps: [
    {
      title: "Describe your asset",
      description: "Be specific about the object you want to generate (e.g., 'vintage treasure chest').",
    },
    {
      title: "Enable Transparency",
      description: "Select a model or mode specifically tuned for transparent PNG output.",
    },
    {
      title: "Download alpha-PNG",
      description: "Get your high-resolution asset with the background already removed.",
    },
  ],
  faqs: [
    {
      question: "Is it really transparent?",
      answer: "Yes, the files are exported with a full alpha channel, meaning no manual background removal is required.",
    },
    {
      question: "What resolution are the assets?",
      answer: "We support high-resolution asset generation, typically up to 2K for transparent objects.",
    },
  ],
  showcase: [
    {
      label: "Isolated Game Item",
      aspectRatio: "square",
      className: "h-full",
      src: "/solutions/transparent-generator/showcase-1.png",
    },
    {
      label: "Character Sprite Sheet",
      aspectRatio: "landscape-wide",
      className: "h-full",
      src: "/solutions/transparent-generator/showcase-2.png",
    },
    {
      label: "Floating UI Icon",
      aspectRatio: "landscape-wide",
      className: "h-full",
      src: "/solutions/transparent-generator/showcase-3.png",
    },
    {
      label: "Transparent VFX Asset",
      aspectRatio: "landscape-wide",
      className: "h-full",
      src: "/solutions/transparent-generator/showcase-4.png",
    },
    {
      label: "Cut-out Product Photo",
      aspectRatio: "landscape-wide",
      className: "h-full",
      src: "/solutions/transparent-generator/showcase-5.png",
    },
  ],
};
