import {
  Zap,
  Sparkles,
  Image as ImageIcon,
  Camera,
  Video,
  Cloud,
  PenTool,
  Layers,
  Palette,
  Shield,
  Clock,
  Maximize,
  RefreshCw,
  Upload,
  Wand2,
  MonitorSmartphone,
  Gauge,
  Eye,
  LayoutGrid,
  Building2,
  ImagePlus,
  MinusCircle,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { cn } from "@/lib/utils";
import type { ModelFeatureCard } from "@/lib/models/types";

// ============================================================================
// Icon Resolution
// ============================================================================

/**
 * Maps lucide icon string names to component references.
 * Extend this map when new icons are referenced in feature card data.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap,
  sparkles: Sparkles,
  image: ImageIcon,
  camera: Camera,
  video: Video,
  cloud: Cloud,
  "pen-tool": PenTool,
  layers: Layers,
  palette: Palette,
  shield: Shield,
  clock: Clock,
  maximize: Maximize,
  "refresh-cw": RefreshCw,
  upload: Upload,
  wand2: Wand2,
  "monitor-smartphone": MonitorSmartphone,
  gauge: Gauge,
  eye: Eye,
  layout: LayoutGrid,
  building: Building2,
  wand: Wand2,
  "image-plus": ImagePlus,
  "minus-circle": MinusCircle,
  "volume-2": Volume2,
};

function resolveIcon(name: string | undefined): LucideIcon {
  if (!name) return Sparkles;
  return ICON_MAP[name] ?? Sparkles;
}

// ============================================================================
// Component
// ============================================================================

interface ModelCapabilitiesProps {
  /** Section heading (defaults to "Key Capabilities") */
  heading?: string;
  /** Section sub-heading */
  subheading?: string;
  /** Feature items to display in the grid */
  features: readonly ModelFeatureCard[];
}

/**
 * Feature grid component for model SEO pages.
 *
 * Renders a responsive grid of capability cards (1→2→3 columns)
 * with glass morphism styling and scroll-reveal animations.
 *
 * Server Component — no client JS required.
 */
export function ModelCapabilities({
  heading = "Key Capabilities",
  subheading,
  features,
}: ModelCapabilitiesProps) {
  return (
    <section className="py-20 bg-black/20 border-y border-white/5">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-brand mb-4">
              {heading}
            </h2>
            {subheading && (
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                {subheading}
              </p>
            )}
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = resolveIcon(feature.icon);

            return (
              <ScrollReveal key={index} delay={index * 100}>
                <div
                  className={cn(
                    "group relative p-6 rounded-2xl transition-all duration-300",
                    "bg-white/5 backdrop-blur-sm border border-white/10",
                    "hover:border-primary/30 hover:bg-white/[0.07]",
                    "hover:shadow-lg hover:shadow-primary/5"
                  )}
                >
                  {/* Icon container */}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-foreground font-brand mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
