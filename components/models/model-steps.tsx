"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

/** A numbered step in a how-to workflow */
interface StepItem {
  readonly title: string;
  readonly description: string;
}

interface ModelStepsProps {
  /** Section heading */
  heading?: string;
  /** Section sub-heading */
  subheading?: string;
  /** Ordered workflow steps */
  steps: readonly StepItem[];
}

// ============================================================================
// Component
// ============================================================================

/**
 * Numbered step cards showing a how-to workflow for a model.
 *
 * Features a sequential reveal animation triggered when the section
 * scrolls into view. Horizontal layout on desktop with a connecting
 * line, vertical timeline on mobile.
 *
 * Client Component — uses IntersectionObserver for step reveal timing.
 */
export function ModelSteps({
  heading = "How It Works",
  subheading = "Three simple steps to start generating.",
  steps,
}: ModelStepsProps) {
  const [visibleStepIndex, setVisibleStepIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          steps.forEach((_, index) => {
            const timer = setTimeout(() => {
              setVisibleStepIndex((current) => Math.max(current, index));
            }, index * 800);
            timers.push(timer);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [steps]);

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-brand mb-4">
              {heading}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {subheading}
            </p>
          </div>
        </ScrollReveal>

        {/* Desktop: Horizontal grid with connecting line */}
        <div
          ref={containerRef}
          className="hidden md:grid md:grid-cols-3 gap-8 relative max-w-5xl mx-auto"
        >
          {/* Connecting line across step indicators */}
          <div className="absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent z-0" />

          {steps.map((step, index) => (
            <ScrollReveal key={index} delay={index * 150}>
              <div className="relative text-center group">
                {/* Number circle */}
                <div
                  className={cn(
                    "w-24 h-24 mx-auto rounded-full bg-background border-4 transition-all duration-700",
                    "flex items-center justify-center mb-6 relative z-10 shadow-xl",
                    index <= visibleStepIndex
                      ? "border-primary/30"
                      : "border-white/5"
                  )}
                >
                  <span
                    className={cn(
                      "text-4xl font-bold font-brand transition-colors duration-700",
                      index <= visibleStepIndex
                        ? "text-primary"
                        : "text-white/10"
                    )}
                  >
                    {index + 1}
                  </span>
                </div>

                <h3 className="text-xl font-bold font-brand mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Mobile: Vertical timeline */}
        <div className="md:hidden space-y-8 relative max-w-md mx-auto pl-12">
          {/* Vertical connecting line */}
          <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary/30 via-primary/20 to-transparent" />

          {steps.map((step, index) => (
            <ScrollReveal key={index} delay={index * 150}>
              <div className="relative">
                {/* Number circle (small, on left) */}
                <div
                  className={cn(
                    "absolute -left-12 top-0 w-10 h-10 rounded-full bg-background border-2 transition-all duration-700",
                    "flex items-center justify-center z-10 shadow-md",
                    index <= visibleStepIndex
                      ? "border-primary/40"
                      : "border-white/10"
                  )}
                >
                  <span
                    className={cn(
                      "text-lg font-bold font-brand transition-colors duration-700",
                      index <= visibleStepIndex
                        ? "text-primary"
                        : "text-white/15"
                    )}
                  >
                    {index + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="pt-1">
                  <h3 className="text-lg font-bold font-brand mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
