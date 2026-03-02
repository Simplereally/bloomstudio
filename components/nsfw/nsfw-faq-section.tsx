import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

interface NSFWFaqSectionProps {
  title: string;
  items: FAQItem[];
}

/**
 * Shared FAQ section for all NSFW SEO pages.
 *
 * Uses native `<details>/<summary>` for accessible, zero-JS disclosure.
 * Each question is an `<h3>` inside `<summary>` for proper heading hierarchy.
 */
export function NSFWFaqSection({ title, items }: NSFWFaqSectionProps) {
  return (
    <section className="py-24 relative border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-brand text-center mb-12">
            {title}
          </h2>

          <div className="space-y-4">
            {items.map((item) => (
              <details
                key={item.question}
                className={cn(
                  "group rounded-2xl bg-white/5 border border-white/10",
                  "transition-colors hover:border-white/20",
                  "[&[open]]:border-white/20"
                )}
              >
                <summary className="flex items-center justify-between cursor-pointer p-6 list-none [&::-webkit-details-marker]:hidden">
                  <h3 className="text-lg font-bold text-foreground pr-4">
                    {item.question}
                  </h3>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-muted-foreground/50 transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="px-6 pb-6 -mt-2">
                  <p className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
