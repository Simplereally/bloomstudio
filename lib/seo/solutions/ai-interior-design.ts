import type { Solution } from "../solution-types";

export const AI_INTERIOR_DESIGN: Solution = {
  title: "AI Interior Design",
  shortTitle: "Interiors",
  slug: "ai-interior-design",
  description:
    "Visualize interior spaces and experiment with countless design styles. Explore room layouts, furniture aesthetics, and color palettes through high-quality AI renders.",
  heroSuffix: "interiors",
  heroImages: [
    "/solutions/ai-interior-design/hero-1.jpg",
    "/solutions/ai-interior-design/hero-2.jpg",
    "/solutions/ai-interior-design/hero-3.jpg",
    "/solutions/ai-interior-design/hero-4.jpg",
  ],
  features: [
    {
      title: "Layout Visualization",
      description:
        "Describe a room and see it in different styles—from Japandi and Mid-century Modern to Industrial. Perfect for visualizing potential furniture arrangements.",
      image: "/solutions/ai-interior-design/feature-1.jpg",
    },
    {
      title: "Aesthetic Exploration",
      description:
        "Experiment with color schemes, lighting, and materials. See how different textures and finishes interact within a space before making any commitments.",
      image: "/solutions/ai-interior-design/feature-2.jpg",
    },
    {
      title: "Style Board Creation",
      description:
        "Create high-quality visual references for your renovation projects. Quickly narrow down the look and feel of your future space for better planning.",
      image: "/solutions/ai-interior-design/feature-3.jpg",
    },
  ],
  steps: [
    {
      title: "Define the space",
      description: "Describe the type of room (e.g., 'sunlit modern kitchen') and the desired vibe.",
    },
    {
      title: "Select Design Elements",
      description: "Mention specific materials or furniture styles to guide the AI's aesthetic choices.",
    },
    {
      title: "View Renders",
      description: "Watch as your interior design concept comes to life in a high-quality visualization.",
    },
  ],
  faqs: [
    {
      question: "Can I restyle my own room?",
      answer:
        "Yes, you can use our image-to-image features to upload a photo of your existing space and generate new design ideas based on it.",
    },
    {
      question: "Is it for technical planning?",
      answer:
        "These are visual concepts for ideation and mood boarding. They are not a substitute for architectural plans or structural engineering.",
    },
  ],
  showcase: [
    {
      label: "Japandi Living Room Layout",
      aspectRatio: "square",
      className: "h-full md:aspect-[1/2]",
      src: "/solutions/ai-interior-design/showcase-1.jpg",
    },
    {
      label: "Modern Industrial Kitchen",
      aspectRatio: "landscape-wide",
      className: "h-full",
      src: "/solutions/ai-interior-design/showcase-2.jpg",
    },
    {
      label: "Minimalist Master Bedroom",
      aspectRatio: "square",
      className: "h-full",
      src: "/solutions/ai-interior-design/showcase-3.jpg",
    },
    {
      label: "Skylit Bohemian Attic",
      aspectRatio: "landscape-wide",
      className: "h-full",
      src: "/solutions/ai-interior-design/showcase-4.jpg",
    },
    { label: "Luxury Marble Bathroom", aspectRatio: "square", className: "h-full", src: "/solutions/ai-interior-design/showcase-5.jpg" },
  ],
};
