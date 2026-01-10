"use client";

import { Play } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";
import { ShowcaseImage } from "./showcase-image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface ShowcaseItem {
  label: string;
  aspectRatio: "square" | "portrait" | "landscape" | "landscape-wide" | "portrait-tall";
  className?: string;
  src?: string;
}

interface ShowcaseSectionProps {
  items?: ShowcaseItem[];
}

export function ShowcaseSection({ items }: ShowcaseSectionProps) {
  const defaultItems: ShowcaseItem[] = [
    { label: "Photorealistic Portrait", aspectRatio: "portrait", className: "h-full" },
    { label: "Abstract Art", aspectRatio: "portrait", className: "h-full", src: "/showcase/abstract-art.png" },
    { label: "Product Shot", aspectRatio: "portrait", className: "h-full" },
    { label: "Landscape Scene", aspectRatio: "portrait", className: "h-full", src: "/showcase/landscape-scene.png" },
    { label: "Character Design", aspectRatio: "portrait", className: "h-full" },
  ];

  const displayItems = items || defaultItems;

  return (
    <section id="showcase" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side: Text Content */}
          <ScrollReveal>
            <div className="text-left">
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">See what you can create</h2>
              <p className="text-lg text-muted-foreground mb-8 text-balance">
                From photorealistic renders to artistic illustrations, bring any vision to life with our state-of-the-art generation models.
              </p>

              {/* Video Entry Point */}
              <div className="relative rounded-xl overflow-hidden glass-effect-home aspect-video group cursor-pointer border border-white/10 shadow-lg max-w-md hidden lg:block">
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110">
                      <Play className="h-5 w-5 text-primary ml-1" />
                    </div>
                    <p className="text-base font-semibold text-foreground">Watch Demo</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Side: Carousel */}
          <ScrollReveal delay={200} className="w-full relative flex flex-col items-center">
            {/* 
                - Centered alignment
                - Symmetrical peek (basis < 100%)
                - Autoplay
            */}
            <Carousel
              plugins={[
                Autoplay({
                  delay: 3000,
                }),
              ]}
              opts={{
                align: "center",
                loop: true,
              }}
              className="w-full max-w-md md:max-w-full"
            >
              <CarouselContent className="-ml-4">
                {displayItems.map((item, index) => (
                  <CarouselItem key={index} className="pl-4 basis-[85%] sm:basis-[70%] md:basis-[60%] pt-2 pb-2">
                    {/* Added padding top/bottom to avoid clipping shadows/hover effects if any */}
                    <div className="h-[400px] sm:h-[450px] transition-all duration-300">
                      <ShowcaseImage
                        label={item.label}
                        aspectRatio={item.aspectRatio}
                        className="h-full w-full shadow-2xl"
                        src={item.src}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Centered Controls */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <CarouselPrevious className="static translate-y-0 translate-x-0 h-10 w-10 border-white/10 hover:bg-white/5 hover:text-white" />
                <CarouselNext className="static translate-y-0 translate-x-0 h-10 w-10 border-white/10 hover:bg-white/5 hover:text-white" />
              </div>
            </Carousel>

            {/* Mobile Video Entry Point (visible only on small screens) */}
            <div className="mt-12 relative rounded-xl overflow-hidden glass-effect-home aspect-video group cursor-pointer border border-white/10 shadow-lg w-full max-w-md lg:hidden">
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110">
                    <Play className="h-5 w-5 text-primary ml-1" />
                  </div>
                  <p className="text-base font-semibold text-foreground">Watch Demo</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
