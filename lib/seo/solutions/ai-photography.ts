import type { Solution } from "../solution-types";

export const AI_PHOTOGRAPHY: Solution = {
  title: "AI Photography",
  shortTitle: "Photos",
  slug: "ai-photography",
  description:
    "Generate hyper-realistic photography through text. Control lighting, composition, and lens effects without a physical camera or studio.",
  heroSuffix: "photos",
  heroImages: [
    "/solutions/ai-photography/hero-1.jpg",
    "/solutions/ai-photography/hero-2.jpg",
    "/solutions/ai-photography/hero-3.jpg",
    "/solutions/ai-photography/hero-4.jpg",
  ],
  features: [
    {
      title: "Virtual Lighting Control",
      description:
        "Simulate complex studio lighting setups, natural golden hour sun, or dramatic cinematic shadows with descriptive prompts.",
      image: "/solutions/ai-photography/feature-1.jpg",
    },
    {
      title: "Compositional Tuning",
      description:
        "Control camera angles, depth of field, and lens types—from wide-angle landscapes to 85mm portraits—using natural language.",
      image: "/solutions/ai-photography/feature-2.jpg",
    },
    {
      title: "Lifelike Product Shots",
      description:
        "Place any product in any environment. Create professional-looking product photography settings without expensive sets or travel.",
      image: "/solutions/ai-photography/feature-3.jpg",
    },
  ],
  steps: [
    {
      title: "Describe the Shot",
      description: "Input the subject, the lighting environment, and the overall mood of the photo.",
    },
    {
      title: "Specify Lens & Angle",
      description: "Add technical details like 'macro', 'low-angle', or 'f/1.8' to guide the AI's rendering style.",
    },
    {
      title: "Generate Photo",
      description: "Watch as our models produce high-fidelity imagery that captures your vision perfectly.",
    },
  ],
  faqs: [
    {
      question: "How realistic are the results?",
      answer:
        "Our pro-tier models like Nano Banana Pro, GPT Image 1.5 and Seedream 4.5 are designed to produce imagery that is often indistinguishable from real photography.",
    },
    {
      question: "Can I use these for my website?",
      answer: "Yes, these are perfect for hero images, blog posts, and marketing materials where high-quality photography is required.",
    },
  ],
  showcase: [
    {
      label: "High-Fashion Studio Portrait",
      aspectRatio: "square",
      className: "h-full md:aspect-[1/2]",
      src: "/solutions/ai-photography/showcase-1.jpg",
    },
    {
      label: "Golden Hour Coastal Landscape",
      aspectRatio: "landscape-wide",
      className: "h-full",
      src: "/solutions/ai-photography/showcase-2.jpg",
    },
    { label: "Macro Dew Drop Photography", aspectRatio: "square", className: "h-full", src: "/solutions/ai-photography/showcase-3.jpg" },
    {
      label: "Urban Street Life Action",
      aspectRatio: "landscape-wide",
      className: "h-full",
      src: "/solutions/ai-photography/showcase-4.jpg",
    },
    { label: "Vintage Polaroid Aesthetic", aspectRatio: "square", className: "h-full", src: "/solutions/ai-photography/showcase-5.jpg" },
  ],
};
