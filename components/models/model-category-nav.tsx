"use client";

import { cn } from "@/lib/utils";
import type { ModelPageCategory, ModelSEOConfig } from "@/lib/models/types";
import { MODEL_PAGE_CATEGORIES } from "@/lib/models/types";
import type { LucideIcon } from "lucide-react";
import { Paintbrush, PenTool, Settings2 } from "lucide-react";
import Link from "next/link";

interface ModelCategoryNavProps {
  model: ModelSEOConfig;
  activeCategory: ModelPageCategory;
}

/** Icon mapping per category for visual reinforcement */
const CATEGORY_ICONS: Record<ModelPageCategory, LucideIcon> = {
  create: Paintbrush,
  edit: PenTool,
  features: Settings2,
};

/**
 * ModelCategoryNav — Tab-style navigation between create / edit / features.
 *
 * Client Component for potential future interactivity (mobile dropdown).
 * Renders as horizontal scroll on mobile, inline tabs on desktop.
 * Only shows tabs for categories the model actually supports.
 */
export function ModelCategoryNav({
  model,
  activeCategory,
}: ModelCategoryNavProps) {
  return (
    <nav
      aria-label="Model page sections"
      className="border-b border-white/5 bg-white/[0.02] backdrop-blur-sm sticky top-[57px] z-40"
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none -mb-px">
          {model.categories.map((category) => {
            const meta = MODEL_PAGE_CATEGORIES[category];
            const Icon = CATEGORY_ICONS[category];
            const isActive = category === activeCategory;

            return (
              <Link
                key={category}
                href={`/models/${model.slug}/${category}`}
                className={cn(
                  "group relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground/60 group-hover:text-foreground/80"
                  )}
                />
                {meta.label}

                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
