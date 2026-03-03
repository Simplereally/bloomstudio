import { ScrollReveal } from "./scroll-reveal";
import {
  Zap,
  ImageIcon,
  Layers,
  Clock,
  Shield,
  Gauge,
  Infinity,
  DollarSign,
} from "lucide-react";

interface Capability {
  icon: typeof Zap;
  label: string;
  value: string;
  detail: string;
}

const capabilities: Capability[] = [
  {
    icon: ImageIcon,
    label: "Daily Output",
    value: "5,000+",
    detail: "generations every 24 hours on Flux Schnell and Z-Image",
  },
  {
    icon: Zap,
    label: "Concurrent Speed",
    value: "10 gen/sec",
    detail: "Fire 10 generations per second — 600 per minute with zero throttle",
  },
  {
    icon: Layers,
    label: "Batch Queue",
    value: "1,000",
    detail: "Queue up to 1,000 generations in a single batch run",
  },
  {
    icon: Clock,
    label: "Wait Times",
    value: "None",
    detail: "No artificial delays — your request hits the model the moment you click",
  },
  {
    icon: Infinity,
    label: "All Models Included",
    value: "8+",
    detail:
      "Imagen 4, Grok Imagine, Grok Video, Flux, GPT Image, Z-Image, Klein & more",
  },
  {
    icon: DollarSign,
    label: "Monthly Price",
    value: "$3",
    detail: "One flat price. Every model, every feature. No credit packs or hidden tiers",
  },
  {
    icon: Shield,
    label: "Private Generations",
    value: "Included",
    detail: "Your creations stay yours — private by default on Pro",
  },
  {
    icon: Gauge,
    label: "Daily Resets",
    value: "Every 24h",
    detail: "Quota refreshes daily so you never lose unused generations to a monthly clock",
  },
];

export function CapabilitiesShowcase() {
  return (
    <ScrollReveal>
      <div className="w-full overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 via-card/80 to-purple-500/5 border border-white/10">
        {/* Header */}
        <div className="px-6 py-8 text-center border-b border-white/5">
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Everything you need, nothing you don&apos;t
          </h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            One subscription. Every model. Massive limits. Here&apos;s exactly what you get for{" "}
            <span className="text-primary font-semibold">$3/month</span>.
          </p>
        </div>

        {/* Capabilities Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <ScrollReveal key={cap.label} delay={i * 60}>
                <div className="flex flex-col gap-3 p-6 bg-card/60 hover:bg-white/[0.04] transition-colors h-full">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {cap.label}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-foreground tabular-nums">
                    {cap.value}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {cap.detail}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </ScrollReveal>
  );
}
