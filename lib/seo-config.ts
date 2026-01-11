// No imports needed for Solution types currently

export interface SolutionFeature {
  title: string;
  description: string;
  image: string;
}

export interface SolutionStep {
  title: string;
  description: string;
}

export interface SolutionFAQ {
  question: string;
  answer: string;
}

export interface Solution {
  title: string;
  shortTitle: string;
  slug: string;
  description: string;
  heroPrefix?: string;
  heroSuffix?: string;
  features: SolutionFeature[];
  steps: SolutionStep[];
  faqs: SolutionFAQ[];
  heroImages?: string[];
  showcase?: {
    label: string;
    aspectRatio: "square" | "portrait" | "landscape" | "landscape-wide" | "portrait-tall";
    className?: string;
    src?: string;
  }[];
}

export const SOLUTIONS: Solution[] = [
  {
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
  },
  {
    title: "AI Image Generator",
    shortTitle: "Images",
    slug: "ai-image-generator",
    description:
      "Generate stunning high-resolution images from any prompt. Powered by a diverse library of world-class AI models like Flux, DALL-E, and Stable Diffusion.",
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
          "Each model has strengths. For example, Flux is great for detail, while DALL-E 3 is excellent for prompt adherence. You can try multiple models for the same prompt.",
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
  },
  {
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
  },
  {
    title: "AI Video Generator",
    shortTitle: "Video",
    slug: "ai-video-generator",
    description:
      "Transform your text and images into engaging short-form video clips. Create motion graphics and cinematic animations in minutes.",
    heroSuffix: "videos",
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
          "Our pro-tier models like Flux Pro and DALL-E 3 are designed to produce imagery that is often indistinguishable from real photography.",
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
  },
  {
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
  },
  {
    title: "AI Architecture",
    shortTitle: "Architecture",
    slug: "ai-architecture",
    description:
      "Generate breathtaking architectural concepts and exterior visualizations. Explore facades, massing, and landscape integration in seconds.",
    heroSuffix: "architecture",
    heroImages: [
      "/solutions/ai-architecture/hero-1.jpeg",
      "/solutions/ai-architecture/hero-2.jpeg",
      "/solutions/ai-architecture/hero-3.jpeg",
      "/solutions/ai-architecture/hero-4.jpeg",
    ],
    features: [
      {
        title: "Concept Massing",
        description:
          "Rapidly iterate on building shapes and structural silhouettes. Explore everything from futuristic glass curves to minimalist concrete blocks.",
        image: "/solutions/ai-architecture/feature-1.jpeg",
      },
      {
        title: "Contextual Visualization",
        description:
          "See your building concept in any environment—whether it's nestled in a forest, integrated into a city skyline, or perched on a coastal cliff.",
        image: "/solutions/ai-architecture/feature-2.jpeg",
      },
      {
        title: "Material & Facade Study",
        description:
          "Experiment with different building skins and materials. Visualize how light interacts with glass, timber, or stone on your building's exterior.",
        image: "/solutions/ai-architecture/feature-3.jpeg",
      },
    ],
    steps: [
      {
        title: "Describe the structure",
        description: "Input the function and general aesthetic of the building you want to visualize.",
      },
      {
        title: "Set the environment",
        description: "Describe the lighting and surrounding context to provide a complete architectural scene.",
      },
      {
        title: "Generate Visualization",
        description: "Watch as our models render a professional-looking architectural concept from your text.",
      },
    ],
    faqs: [
      {
        question: "Is this for professional use?",
        answer:
          "Yes, architects use our tool for early-stage ideation, mood boarding, and generating quick visual references for client meetings.",
      },
      {
        question: "Are these engineering files?",
        answer:
          "No, these are high-quality visual renders. They are intended for conceptual exploration rather than technical documentation.",
      },
    ],
    showcase: [
      {
        label: "Futuristic Glass Facade Concept",
        aspectRatio: "landscape",
        className: "h-full",
        src: "/solutions/ai-architecture/showcase-1.jpeg",
      },
      {
        label: "Brutalist Concrete Museum Render",
        aspectRatio: "landscape",
        className: "h-full",
        src: "/solutions/ai-architecture/showcase-2.jpeg",
      },
      {
        label: "Parametric Pavilion Visualization",
        aspectRatio: "landscape",
        className: "h-full",
        src: "/solutions/ai-architecture/showcase-3.jpeg",
      },
      {
        label: "Sustainable Green Skyscraper",
        aspectRatio: "landscape",
        className: "h-full",
        src: "/solutions/ai-architecture/showcase-4.jpeg",
      },
      {
        label: "Bauhaus Inspired Residence",
        aspectRatio: "landscape",
        className: "h-full",
        src: "/solutions/ai-architecture/showcase-5.jpeg",
      },
    ],
  },
];

export const RESOURCES = [
  { name: "About", href: "/about" },
  { name: "Pricing", href: "/pricing" },
  { name: "FAQ", href: "/faq" },
  { name: "Support", href: "/support" },
  { name: "Contact us", href: "/contact" },
];
