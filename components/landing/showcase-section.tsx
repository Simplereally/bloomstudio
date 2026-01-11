import { ScrollReveal } from "./scroll-reveal";
import { ShowcaseImage } from "./showcase-image";
import { Slideshow, SlideshowSlide } from "@/components/ui/slideshow";

interface ShowcaseItem {
  label: string;
  aspectRatio: "square" | "portrait" | "landscape" | "landscape-wide" | "portrait-tall";
  className?: string;
  src?: string;
}

interface ShowcaseSectionProps {
  items?: ShowcaseItem[];
}

/**
 * ShowcaseSection - Server Component with Client Islands
 * 
 * Static content (headings, text) is server-rendered for SEO.
 * The Slideshow component is a client island that handles interactivity.
 * Images use next/image with lazy loading via the Slideshow's built-in thumbnail rendering.
 */
export function ShowcaseSection({ items }: ShowcaseSectionProps) {
  const defaultItems: ShowcaseItem[] = [
    { label: "Photorealistic Closeup", aspectRatio: "portrait", className: "h-full", src: "/showcase/photorealistic-closeup.jpeg" },
    { label: "Abstract Art", aspectRatio: "portrait", className: "h-full", src: "/showcase/abstract-art.jpeg" },
    { label: "Product Shot", aspectRatio: "portrait", className: "h-full", src: "/showcase/product-shot.jpeg" },
    { label: "Landscape Scene", aspectRatio: "portrait", className: "h-full", src: "/showcase/landscape-scene.jpeg" },
    { label: "Influencer", aspectRatio: "portrait", className: "h-full", src: "/showcase/influencer.jpeg" },
  ];

  const displayItems = items || defaultItems;

  // Transform items into slideshow slides with declarative thumbnailSrc
  const slides: SlideshowSlide[] = displayItems.map((item, index) => ({
    key: index,
    label: item.label,
    thumbnailSrc: item.src, // Pass image source for thumbnail rendering
    content: (
      <ShowcaseImage
        label={item.label}
        aspectRatio={item.aspectRatio}
        className="h-full w-full"
        src={item.src}
      />
    ),
  }));

  return (
    <section id="showcase" className="py-16 md:py-20 lg:py-24 xl:py-28 2xl:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-6 xl:gap-8 items-center">
          {/* Left Side: Text Content with SEO-optimized copy */}
          <ScrollReveal className="lg:pr-4">
            <div className="text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 lg:mb-6">
                See what you can create
              </h2>
              <p className="text-base lg:text-lg xl:text-xl text-muted-foreground mb-4 lg:mb-6 text-balance max-w-lg xl:max-w-xl">
                From photorealistic renders to artistic illustrations, bring any vision to life with our state-of-the-art AI image generator and text-to-image models.
              </p>
              <p className="text-sm lg:text-base text-muted-foreground/80 text-balance max-w-lg xl:max-w-xl">
                Generate high-resolution artwork, professional product photography, lifestyle influencer photos, and creative digital art — all powered by the latest AI models including GPT-4 Image, Flux, and Seedream. Perfect for designers, marketers, and creative professionals who need instant, high-quality visual content.
              </p>
            </div>
          </ScrollReveal>

          {/* Right Side: Slideshow - 1:1 ratio for square showcase images */}
          <ScrollReveal delay={200} className="w-full flex justify-center lg:justify-end">
            <Slideshow
              slides={slides}
              className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl"
              aspectRatio="1/1"
              frameClassName="h-[320px] sm:h-[380px] md:h-[440px] lg:h-[480px] xl:h-[520px] 2xl:h-[580px]"
              showInfo={true}
              showThumbnails={true}
              showProgress={false}
              options={{
                autoAdvanceDelay: 3000,
                visibilityThreshold: 0.7,
              }}
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
