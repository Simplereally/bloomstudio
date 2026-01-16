import { ScrollReveal } from "./scroll-reveal";
import { CompetitorComparison } from "./competitor-comparison";

export function ValuePropSection() {
  return (
    <section id="compare" className="py-24 xl:py-28 2xl:py-32 3xl:py-40 4xl:py-48 5xl:py-56 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-[1172px] mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12 3xl:mb-16 4xl:mb-20">
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Why pay more elsewhere?</h2>
              <p className="text-lg text-muted-foreground">A simple comparison that speaks for itself.</p>
            </div>
          </ScrollReveal>

          {/* Competitor comparison table */}
          <div className="mb-12">
            <CompetitorComparison />
          </div>

          {/* Feature highlights */}
          <div className="grid sm:grid-cols-2 gap-4">
            <ScrollReveal delay={300}>
              <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-white/5 via-card/80 to-purple-500/5 border border-white/10">
                <h3 className="font-bold text-foreground mb-2">Daily Resets</h3>
                <p className="text-sm text-muted-foreground">
                  Your quota resets every 24 hours. Never lose unused generations like with monthly-reset competitors.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={400}>
              <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-white/5 via-card/80 to-purple-500/5 border border-white/10">
                <h3 className="font-bold text-foreground mb-2">1,000 Image Batch Queue</h3>
                <p className="text-sm text-muted-foreground">
                  Queue up massive batches while competitors limit you to 4-8 images at a time.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={500}>
              <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-white/5 via-card/80 to-purple-500/5 border border-white/10">
                <h3 className="font-bold text-foreground mb-2">All Models Included</h3>
                <p className="text-sm text-muted-foreground">
                  Every premium model is included: Nano Banana Pro, Veo3.1, Seedance, Seedream Pro — no extras to unlock.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={600}>
              <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-white/5 via-card/80 to-purple-500/5 border border-white/10">
                <h3 className="font-bold text-foreground mb-2">NSFW Enabled 🤭</h3>
                <p className="text-sm text-muted-foreground">
                  Creative freedom without arbitrary restrictions on models that support it. Generate what you imagine.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
