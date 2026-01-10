"use client";

import { MODEL_REGISTRY } from "@/lib/config/models";
import { cn } from "@/lib/utils";
import { ImageIcon, Sparkles, Video } from "lucide-react";
import Image from "next/image";
import { ScrollReveal } from "./scroll-reveal";

function ModelBadgeDetailed({ model }: { model: (typeof MODEL_REGISTRY)[keyof typeof MODEL_REGISTRY] }) {
  const isMonochrome = model.logo?.includes("openai.svg") || model.logo?.includes("flux.svg");

  return (
    <div className="group relative flex items-center gap-3 p-3 px-4 rounded-xl bg-white/[0.06] border border-primary/50 transition-all duration-300">
      {model.logo ? (
        <div className="relative w-6 h-6 opacity-100 flex-shrink-0">
          <Image src={model.logo} alt={`${model.displayName} logo`} fill className={cn("object-contain", isMonochrome && "dark:invert")} />
        </div>
      ) : (
        <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
      )}
      <div className="flex flex-col min-w-0">
        <span className="text-[14px] font-bold font-brand text-foreground uppercase tracking-tight truncate">{model.displayName}</span>
        <span className="text-[11px] text-muted-foreground/90 leading-tight line-clamp-1">{model.description}</span>
      </div>
    </div>
  );
}

export function ModelsSection() {
  const allModels = Object.values(MODEL_REGISTRY);
  const imageModels = allModels.filter((m) => m.type === "image");
  const videoModels = allModels.filter((m) => m.type === "video");

  return (
    <section id="models" className="py-24 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Every model, <span className="text-primary">one subscription</span>.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Access the world&apos;s most powerful AI models without juggling multiple subscriptions or complex token systems.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="max-w-[1100px] mx-auto relative group">
            {/* Box Glow */}
            <div className="absolute inset-0 bg-primary/10 blur-[40px] rounded-[32px] pointer-events-none transition-colors duration-500" />

            {/* Main Card */}
            <div className="relative rounded-[32px] bg-[#0A0A0A]/80 border border-white/10 shadow-2xl backdrop-blur-sm overflow-hidden p-6 md:p-10 pt-14 md:pt-16">
              {/* Card Header Badge - Centered without translate to avoid blur */}
              <div className="absolute top-0 left-0 right-0 flex justify-center">
                <div className="bg-[#0D0D0D] px-8 py-3 border-x border-b border-white/10 rounded-b-2xl shadow-xl">
                  <span className="text-[12px] font-black uppercase tracking-[0.4em] text-foreground/70">Full Support List</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
                {/* Image Models Column */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <ImageIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground tracking-tight">Image Generation</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mt-0.5">
                        {imageModels.length} Models Available
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {imageModels.map((model) => (
                      <ModelBadgeDetailed key={model.id} model={model} />
                    ))}
                  </div>
                </div>

                {/* Video Models Column */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                      <Video className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground tracking-tight">Video Generation</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mt-0.5">
                        {videoModels.length} Models Available
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {videoModels.map((model) => (
                      <ModelBadgeDetailed key={model.id} model={model} />
                    ))}
                  </div>

                  {/* Bonus info */}
                  <div className="mt-6 p-6 rounded-2xl bg-white/[0.03] border border-dashed border-white/10">
                    <p className="text-sm text-muted-foreground text-center leading-relaxed italic">
                      Experience ultimate creative flexibility by switching between models instantly. Our curated library is built to handle
                      everything from photorealistic renders to artistic stylization.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
