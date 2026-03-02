import { ScrollReveal } from "./scroll-reveal";
import { CapabilitiesShowcase } from "./competitor-comparison";

export function ValuePropSection() {
  return (
    <section id="capabilities" className="py-24 xl:py-28 2xl:py-32 3xl:py-40 4xl:py-48 5xl:py-56 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-[1172px] mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12 3xl:mb-16 4xl:mb-20">
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Built for serious creators</h2>
              <p className="text-lg text-muted-foreground">Generous limits, all models included, one flat price.</p>
            </div>
          </ScrollReveal>

          {/* Capabilities showcase */}
          <div className="mb-12">
            <CapabilitiesShowcase />
          </div>

          {/* Feature highlights */}
          <div className="grid sm:grid-cols-2 gap-4">
            <ScrollReveal delay={300}>
              <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-white/5 via-card/80 to-purple-500/5 border border-white/10">
                <h3 className="font-bold text-foreground mb-2">Daily Resets</h3>
                <p className="text-sm text-muted-foreground">
                  Your quota resets every 24 hours. Start fresh each day with your full allowance — no waiting until the end of the month.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={400}>
              <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-white/5 via-card/80 to-purple-500/5 border border-white/10">
                <h3 className="font-bold text-foreground mb-2">1,000 Image Batch Queue</h3>
                <p className="text-sm text-muted-foreground">
                  Queue up massive batches and let them process while you focus on your next idea. Up to 1,000 generations in one go.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={500}>
              <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-white/5 via-card/80 to-purple-500/5 border border-white/10">
                <h3 className="font-bold text-foreground mb-2">All Models Included</h3>
                <p className="text-sm text-muted-foreground">
                  Every active model is included: Imagen 4, Grok Imagine, Grok Video, Flux Schnell, GPT Image, Z-Image, Klein 4B & 9B, Seedance — no extras to unlock.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={600}>
              <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-white/5 via-card/80 to-purple-500/5 border border-white/10">
                <h3 className="font-bold text-foreground mb-2">NSFW Enabled</h3>
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
