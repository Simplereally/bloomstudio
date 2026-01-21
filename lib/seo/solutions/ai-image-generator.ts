import type { Solution } from "../solution-types";

export const AI_IMAGE_GENERATOR: Solution = {
  title: "AI Image Generator",
  shortTitle: "Images",
  slug: "ai-image-generator",
  description:
    "Generate stunning high-resolution images from any prompt. Powered by a diverse library of world-class AI models like Nano Banana Pro, GPT Image 1.5, and Seedream 4.5.",
  heroSuffix: "images",
  heroImages: [
    "/solutions/ai-image-generator/hero-1.jpg",
    "/solutions/ai-image-generator/hero-2.jpg",
    "/solutions/ai-image-generator/hero-3.jpg",
    "/solutions/ai-image-generator/hero-4.jpg",
  ],
  features: [
    {
      title: "Multi-Model Choice",
      description:
        "Access the world's best image models in one place. Choose the specific model that best fits your required style, from photorealism to surrealism.",
      image: "/solutions/ai-image-generator/feature-1.jpg",
    },
    {
      title: "Prompt Enhancement",
      description:
        "Our intelligent prompt expansion helps you get better results by adding descriptive detail and artistic context to your simple ideas.",
      image: "/solutions/ai-image-generator/feature-2.jpg",
    },
    {
      title: "Indistinguishable Quality",
      description:
        "Create crystal clear visuals with advanced lighting, ray-traced reflections, and physically accurate textures using our pro-tier models.",
      image: "/solutions/ai-image-generator/feature-3.jpg",
    },
  ],
  steps: [
    {
      title: "Enter your prompt",
      description: "Describe the image you want to create in natural language.",
    },
    {
      title: "Choose your model",
      description: "Select from our curated list of elite AI models based on your specific quality and style needs.",
    },
    {
      title: "Generate & Refine",
      description: "Watch your vision come to life in seconds and adjust the prompt to perfect the output.",
    },
  ],
  faqs: [
    {
      question: "Which model should I use?",
      answer:
        "Each model has strengths. For example, Nano Banana Pro is great for detail, while GPT Image 1.5 is excellent for prompt adherence. You can try multiple models for the same prompt.",
    },
    {
      question: "Do I have rights to the images?",
      answer: "Yes, you retain full rights to the images you generate using our platform's models.",
    },
  ],
  showcase: [
    { label: "Cyberpunk Cityscape", aspectRatio: "landscape", className: "h-full", src: "/solutions/ai-image-generator/showcase-1.jpg" },
    { label: "Ethereal Forest Path", aspectRatio: "landscape", className: "h-full", src: "/solutions/ai-image-generator/showcase-2.jpg" },
    {
      label: "Gothic Cathedral Interior",
      aspectRatio: "landscape",
      className: "h-full",
      src: "/solutions/ai-image-generator/showcase-3.jpg",
    },
    {
      label: "Sci-Fi Starship Bridge",
      aspectRatio: "landscape",
      className: "h-full",
      src: "/solutions/ai-image-generator/showcase-4.jpg",
    },
    {
      label: "Mystical Mountain Peak",
      aspectRatio: "landscape",
      className: "h-full",
      src: "/solutions/ai-image-generator/showcase-5.jpg",
    },
  ],
};
