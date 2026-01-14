import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

/**
 * Curated community images showcasing platform capabilities.
 * Each image represents a different style/use case to demonstrate variety.
 */
const COMMUNITY_IMAGES = [
  {
    src: "/community/portrait.png",
    alt: "Hyperrealistic portrait with cinematic lighting",
    prompt: "Hyperrealistic portrait with luminous skin and soft bokeh",
  },
  {
    src: "/community/fantasy.png",
    alt: "Fantasy landscape with floating islands",
    prompt: "Epic fantasy landscape with bioluminescent plants",
  },
  {
    src: "/community/product.png",
    alt: "Luxury watch product photography",
    prompt: "Minimalist luxury watch on marble surface",
  },
  {
    src: "/community/cyberpunk.png",
    alt: "Cyberpunk cityscape at night",
    prompt: "Cyberpunk city with neon signs and rain",
  },
  {
    src: "/community/cat.png",
    alt: "Fluffy orange cat in sunbeam",
    prompt: "Adorable fluffy cat with expressive eyes",
  },
  {
    src: "/community/abstract.png",
    alt: "Abstract fluid art with vibrant colors",
    prompt: "Abstract fluid art with gold metallic accents",
  },
  {
    src: "/community/fashion.png",
    alt: "Avant-garde fashion editorial",
    prompt: "Fashion editorial in haute couture dress",
  },
  {
    src: "/community/interior.png",
    alt: "Cozy cabin interior with mountain view",
    prompt: "Cozy cabin with fireplace and snowy mountains",
  },
];

/**
 * CommunitySection - Landing Page Section
 *
 * Displays a curated preview of community creations to showcase
 * the platform's creative potential. Links to the full public feed.
 *
 * Design considerations:
 * - Matches existing landing page aesthetic (glass morphism, gradients)
 * - Responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop
 * - Hover overlays with prompt preview
 * - Clear CTA to explore full feed
 */
export function CommunitySection() {
  return (
    <section
      id="community"
      className="py-16 md:py-20 lg:py-24 xl:py-28 2xl:py-32 3xl:py-40 4xl:py-48 5xl:py-56 3xl:min-h-[calc(100vh-4rem)] 3xl:flex 3xl:flex-col 3xl:justify-center relative overflow-hidden"
    >
      {/* Background Decorations */}
      <div className="absolute top-1/3 left-0 w-[600px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/3 right-0 w-[500px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <ScrollReveal>
          <div className="text-center mb-10 md:mb-12 lg:mb-16 3xl:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground/80">Community Creations</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 tracking-tight">
              See what the <span className="text-primary">community</span> is creating
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Explore thousands of stunning AI-generated images and videos from creators around the world.
              Get inspired and start creating your own masterpieces.
            </p>
          </div>
        </ScrollReveal>

        {/* Image Grid */}
        <ScrollReveal delay={200}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 3xl:gap-6 4xl:gap-8 max-w-7xl mx-auto mb-10 md:mb-12 lg:mb-16">
            {COMMUNITY_IMAGES.map((image, index) => (
              <Link
                key={image.src}
                href="/feed/public"
                className="group relative aspect-square rounded-xl md:rounded-2xl overflow-hidden bg-white/5 border border-white/10 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority={index < 4} // Priority load first row
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 md:p-4">
                  <p className="text-xs md:text-sm text-white/90 line-clamp-2 font-medium">
                    {image.prompt}
                  </p>
                </div>

                {/* Subtle gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none" />
              </Link>
            ))}
          </div>
        </ScrollReveal>

        {/* CTA Button */}
        <ScrollReveal delay={400}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/feed/public">
              <Button
                size="lg"
                className="px-8 h-12 md:h-14 text-base md:text-lg transition-all group"
              >
                Explore All Creations
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              A public feed of our users' creations
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
