import Link from "next/link";
import { cn } from "@/lib/utils";

interface NSFWBreadcrumbProps {
  /** Trail of links ending with the current page */
  items: Array<{
    label: string;
    href?: string;
  }>;
  /** Accent colour for the current (last) item */
  accent?: "rose" | "violet";
}

/**
 * Semantic breadcrumb navigation for NSFW sub-pages.
 *
 * Wraps links in a `<nav aria-label="Breadcrumb">` with an ordered list
 * for screen-reader accessibility and search-engine comprehension.
 */
export function NSFWBreadcrumb({ items, accent = "rose" }: NSFWBreadcrumbProps) {
  const accentColor = accent === "rose" ? "text-rose-400" : "text-violet-400";
  const hoverColor =
    accent === "rose" ? "hover:text-rose-400" : "hover:text-violet-400";

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center justify-center gap-2 text-sm text-muted-foreground/60 list-none p-0 m-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {isLast || !item.href ? (
                <span
                  className={cn(isLast && accentColor)}
                  {...(isLast ? { "aria-current": "page" as const } : {})}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn("transition-colors", hoverColor)}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
