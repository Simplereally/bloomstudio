import { LandingHeader } from "@/components/landing/landing-header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";

interface ModelPageShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ModelPageShell — Outer wrapper for all model SEO pages.
 *
 * Provides the dark theme context, consistent background, header/footer,
 * and selection styling that every model page shares. This is a Server
 * Component; interactivity lives in the child components it wraps.
 *
 * Mirrors the solutions page pattern:
 * @see app/solutions/[slug]/page.tsx
 */
export function ModelPageShell({ children, className }: ModelPageShellProps) {
  return (
    <div
      className={cn(
        "dark min-h-screen relative bg-background",
        "selection:bg-primary/30 selection:text-primary-foreground",
        className
      )}
    >
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
