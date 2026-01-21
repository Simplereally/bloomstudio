import type { Solution } from "../solution-types";

export const AI_VIDEO_GENERATOR: Solution = {
  title: "AI Video Generator",
  shortTitle: "Video",
  slug: "ai-video-generator",
  description:
    "Transform your text and images into engaging short-form video clips. Create motion graphics and cinematic animations in minutes.",
  heroSuffix: "videos",
  isVideo: true,
  heroImages: [
    "/solutions/ai-video-generator/hero-1.mp4",
    "/solutions/ai-video-generator/hero-2.mp4",
    "/solutions/ai-video-generator/hero-3.mp4",
    "/solutions/ai-video-generator/hero-4.mp4",
  ],
  features: [
    {
      title: "Cinematic Motion",
      description: "Describe a scene and let our AI generate a short video clip with professional camera movements and lighting.",
      image: "/solutions/ai-video-generator/feature-1.mp4",
    },
    {
      title: "Image Animation",
      description:
        "Bring your favorite static images to life. Add subtle movement to portraits or create flowing landscapes with our image-to-video tools.",
      image: "/solutions/ai-video-generator/feature-2.mp4",
    },
    {
      title: "Fast Generation",
      description:
        "Experience rapid video rendering. Most short-form clips are ready in just a few minutes, allowing for quick creative iteration.",
      image: "/solutions/ai-video-generator/feature-3.mp4",
    },
  ],
  steps: [
    {
      title: "Describe the action",
      description: "Write a prompt detailing the motion and atmosphere you want to capture.",
    },
    {
      title: "Select Video Model",
      description: "Choose from specialized video models optimized for different styles of motion.",
    },
    {
      title: "Generate Clip",
      description: "Watch as your scene comes to life in a high-quality video file.",
    },
  ],
  faqs: [
    {
      question: "How long are the clips?",
      answer: "Currently, our models generate 4-5 second clips which are perfect for social media or B-roll.",
    },
    {
      question: "Can I generate long movies?",
      answer: "You can generate multiple clips and stitch them together in a video editor to create longer content.",
    },
  ],
  showcase: [
    {
      label: "Cinematic Drone Shot",
      aspectRatio: "square",
      className: "h-full md:aspect-[1/2]",
      src: "/solutions/ai-video-generator/showcase-1.mp4",
    },
    {
      label: "Abstract Liquid Animation",
      aspectRatio: "landscape-wide",
      className: "h-full",
      src: "/solutions/ai-video-generator/showcase-2.mp4",
    },
    { label: "Character Motion Test", aspectRatio: "square", className: "h-full", src: "/solutions/ai-video-generator/showcase-3.mp4" },
    {
      label: "Hyper-lapse Transition",
      aspectRatio: "landscape-wide",
      className: "h-full",
      src: "/solutions/ai-video-generator/showcase-4.mp4",
    },
    { label: "Lo-fi Aesthetic Loop", aspectRatio: "square", className: "h-full", src: "/solutions/ai-video-generator/showcase-5.mp4" },
  ],
};
