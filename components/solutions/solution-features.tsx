import type { SolutionFeature } from "@/lib/seo-config";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { SmartVideo } from "@/components/ui/smart-video";

const isVideo = (src: string) => src.toLowerCase().endsWith(".mp4");

interface SolutionFeaturesProps {
  features: SolutionFeature[];
}

export function SolutionFeatures({ features }: SolutionFeaturesProps) {
  return (
    <section className="py-16 bg-black/20 border-y border-white/5 overflow-hidden">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why use our tool?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to streamline your workflow and boost creativity.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-20 md:space-y-32">
          {features.map((feature, index) => {
            const isEven = index % 2 === 0;

            return (
              <div key={index} className={cn("flex flex-col md:flex-row items-center gap-8 md:gap-16", !isEven && "md:flex-row-reverse")}>
                {/* Image Side */}
                <div className="flex-1 w-full">
                  <ScrollReveal delay={index * 100} x={isEven ? -50 : 50}>
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent mix-blend-overlay z-10" />
                      {feature.image ? (
                        isVideo(feature.image) ? (
                          <SmartVideo src={feature.image} className="h-full w-full object-cover" autoPlay muted loop playsInline lazy={true} />
                        ) : (
                          <Image
                            src={feature.image}
                            alt={feature.title}
                            fill
                            className="object-cover transition-transform duration-700 hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <div className="w-16 h-16 rounded-full bg-primary/10 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </ScrollReveal>
                </div>

                {/* Text Side */}
                <div className="flex-1 space-y-4">
                  <ScrollReveal delay={index * 100 + 200} x={isEven ? 50 : -50}>
                    <h3 className="text-3xl md:text-4xl font-bold">{feature.title}</h3>
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">{feature.description}</p>
                  </ScrollReveal>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
