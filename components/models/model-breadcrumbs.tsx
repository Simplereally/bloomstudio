import { JsonLd } from "@/components/seo/json-ld";
import type { ModelSEOConfig, ModelPageCategory } from "@/lib/models/types";
import { MODEL_PAGE_CATEGORIES } from "@/lib/models/types";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface ModelBreadcrumbsProps {
  model: ModelSEOConfig;
  category: ModelPageCategory;
}

/**
 * ModelBreadcrumbs — SEO breadcrumbs with schema.org BreadcrumbList JSON-LD.
 *
 * Renders a visible breadcrumb trail (Home → Models → [Model] → [Category])
 * plus an invisible structured data script for search engines. Server Component.
 */
export function ModelBreadcrumbs({ model, category }: ModelBreadcrumbsProps) {
  const categoryMeta = MODEL_PAGE_CATEGORIES[category];

  const items = [
    { name: "Home", href: "/" },
    { name: "Models", href: "/models" },
    { name: model.displayName, href: `/models/${model.slug}/create` },
    { name: categoryMeta.label, href: `/models/${model.slug}/${category}` },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: `https://bloomstudio.fun${item.href}`,
          })),
        }}
      />

      <nav
        aria-label="Breadcrumb"
        className="container mx-auto px-6 pt-24 md:pt-28 pb-2"
      >
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={item.href} className="flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronRight
                    className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0"
                    aria-hidden
                  />
                )}
                {isLast ? (
                  <span className="text-foreground/70 font-medium truncate max-w-[180px]">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-foreground transition-colors truncate max-w-[180px]"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
