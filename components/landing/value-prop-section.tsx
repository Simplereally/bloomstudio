"use client";

import { Download } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";
import { CompetitorComparison } from "./competitor-comparison";

export function ValuePropSection() {
  return (
    <section id="compare" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-[1172px] mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
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
              <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20">
                <h3 className="font-bold text-foreground mb-2">Daily Resets</h3>
                <p className="text-sm text-muted-foreground">
                  Your quota resets every 24 hours. Never lose unused generations like with monthly-reset competitors.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={400}>
              <div className="h-full p-6 rounded-2xl glass-effect-home">
                <h3 className="font-bold text-foreground mb-2">1,000+ Batch Queue</h3>
                <p className="text-sm text-muted-foreground">
                  Queue up massive batches while competitors limit you to 10-20 images at a time.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={500}>
              <div className="h-full p-6 rounded-2xl glass-effect-home">
                <h3 className="font-bold text-foreground mb-2">All Models Included</h3>
                <p className="text-sm text-muted-foreground">
                  No extra tokens for premium models. GPT-4 Image, Seedream Pro, everything is included.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={600}>
              <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent border border-purple-500/30">
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
