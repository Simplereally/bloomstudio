import { cn } from "@/lib/utils";

interface HowToStep {
  step: number;
  title: string;
  description: string;
}

interface NSFWHowToSectionProps {
  title: string;
  subtitle: string;
  steps: HowToStep[];
  /** Gradient accent for step number circles */
  accent?: "rose-violet" | "violet-rose";
}

/**
 * Shared "How To" steps section for NSFW SEO pages.
 *
 * Renders a 4-column step grid with numbered circles. Used by both
 * the images and videos pages.
 *
 * All Tailwind classes are static strings to ensure JIT compilation.
 */
export function NSFWHowToSection({
  title,
  subtitle,
  steps,
  accent = "rose-violet",
}: NSFWHowToSectionProps) {
  return (
    <section className="py-24 relative">
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent"
        aria-hidden="true"
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-brand mb-4">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto list-none p-0">
          {steps.map((step) => (
            <li
              key={step.step}
              className="relative p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br text-white font-bold text-sm mb-4",
                  accent === "rose-violet"
                    ? "from-rose-500 to-violet-500"
                    : "from-violet-500 to-rose-500"
                )}
                aria-hidden="true"
              >
                {step.step}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
