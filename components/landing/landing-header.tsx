"use client";

import { ClerkUserButton } from "@/components/clerk-user-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useScrollSpy } from "@/hooks/use-scroll-spy";

const LANDING_SECTIONS = ["hero", "showcase", "compare", "features", "models", "community", "get-started"];

/**
 * Custom hook to detect scroll position for header shrinking effect
 */
function useScrolled(threshold = 50) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > threshold);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return scrolled;
}

/**
 * Landing page header with scroll-based shrinking animation and auth state.
 * This is a Client Component because it uses hooks (useScrolled, useUser).
 * Separated from the main page to allow the rest of the landing page to be
 * server-rendered for SEO.
 */
export function LandingHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const scrolled = useScrolled();
  const activeSection = useScrollSpy(LANDING_SECTIONS);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      // If we're already on the landing page and it's a hash link
      if (pathname === "/" && href.startsWith("#")) {
        e.preventDefault();
        const id = href.substring(1);
        const element = document.getElementById(id);
        if (element) {
          // Force scroll even if hash is the same
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementPosition,
            behavior: "smooth",
          });

          // Update hash
          window.history.pushState(null, "", href);
        }
      } else if (pathname !== "/" && href.startsWith("/#")) {
        // If we're on another page, let the standard Link handle it
        // which will navigate to / and then scroll to hash
      }
    },
    [pathname]
  );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-all duration-300 ease-out border-b",
        scrolled ? "py-1.5 bg-black/60 border-white/5 shadow-sm" : "py-2 lg:py-6 bg-black/5 border-transparent shadow-none",
        mobileMenuOpen && "bg-black/90 border-white/10"
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary font-brand tracking-tight -skew-x-6 whitespace-nowrap">Bloom Studio</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href={pathname === "/" ? "#showcase" : "/#showcase"}
              onClick={(e) => handleNavClick(e, pathname === "/" ? "#showcase" : "/#showcase")}
              className="group"
            >
              <span className={cn(
                "relative inline-flex items-center text-sm font-medium transition-colors cursor-pointer py-2",
                activeSection === "showcase" ? "text-primary" : "text-foreground/70 hover:text-foreground"
              )}>
                Showcase
                <span className={cn(
                  "absolute bottom-1 left-0 h-px transition-all duration-300 ease-out",
                  activeSection === "showcase" ? "w-full bg-primary/60" : "w-0 bg-foreground/40 group-hover:w-full"
                )} />
              </span>
            </Link>
            <Link
              href={pathname === "/" ? "#compare" : "/#compare"}
              onClick={(e) => handleNavClick(e, pathname === "/" ? "#compare" : "/#compare")}
              className="group"
            >
              <span className={cn(
                "relative inline-flex items-center text-sm font-medium transition-colors cursor-pointer py-2",
                activeSection === "compare" ? "text-primary" : "text-foreground/70 hover:text-foreground"
              )}>
                Compare
                <span className={cn(
                  "absolute bottom-1 left-0 h-px transition-all duration-300 ease-out",
                  activeSection === "compare" ? "w-full bg-primary/60" : "w-0 bg-foreground/40 group-hover:w-full"
                )} />
              </span>
            </Link>
            <Link
              href={pathname === "/" ? "#features" : "/#features"}
              onClick={(e) => handleNavClick(e, pathname === "/" ? "#features" : "/#features")}
              className="group"
            >
              <span className={cn(
                "relative inline-flex items-center text-sm font-medium transition-colors cursor-pointer py-2",
                activeSection === "features" ? "text-primary" : "text-foreground/70 hover:text-foreground"
              )}>
                Features
                <span className={cn(
                  "absolute bottom-1 left-0 h-px transition-all duration-300 ease-out",
                  activeSection === "features" ? "w-full bg-primary/60" : "w-0 bg-foreground/40 group-hover:w-full"
                )} />
              </span>
            </Link>
            <Link
              href={pathname === "/" ? "#models" : "/#models"}
              onClick={(e) => handleNavClick(e, pathname === "/" ? "#models" : "/#models")}
              className="group"
            >
              <span className={cn(
                "relative inline-flex items-center text-sm font-medium transition-colors cursor-pointer py-2",
                activeSection === "models" ? "text-primary" : "text-foreground/70 hover:text-foreground"
              )}>
                Models
                <span className={cn(
                  "absolute bottom-1 left-0 h-px transition-all duration-300 ease-out",
                  activeSection === "models" ? "w-full bg-primary/60" : "w-0 bg-foreground/40 group-hover:w-full"
                )} />
              </span>
            </Link>

            <Link href="/pricing" className="group">
              <span className={cn(
                "relative inline-flex items-center text-sm font-medium transition-colors cursor-pointer py-2",
                pathname === "/pricing" ? "text-primary" : "text-foreground/70 hover:text-foreground"
              )}>
                Pricing
                <span className={cn(
                  "absolute bottom-1 left-0 h-px transition-all duration-300 ease-out",
                  pathname === "/pricing" ? "w-full bg-primary/60" : "w-0 bg-foreground/40 group-hover:w-full"
                )} />
              </span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 ml-4">
          {/* Community Feed - Soft glow portal effect, visually distinct from primary CTAs */}
          <Link href="/feed/public" className="hidden lg:block group/feed">
            <Button
              variant="ghost"
              className={cn(
                // Base styling: Refined glass-outline
                "relative h-9 px-4 border transition-all duration-300 ease-out overflow-hidden bg-white/5 border-white/10",
                // Typography: Editorial Style matching 'Open Studio'
                "text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/80",
                // Hover state: Subtle lift and color shift
                "hover:bg-primary/5 hover:border-primary/30 hover:text-foreground",
                // Active state
                pathname.startsWith("/feed") && "bg-primary/10 border-primary/40 text-primary shadow-[0_0_15px_-7px_var(--primary)]"
              )}
            >
              {/* Refined glint effect on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover/feed:animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
              
              <Users className={cn(
                "h-3.5 w-3.5 mr-2 transition-colors",
                pathname.startsWith("/feed") ? "text-primary" : "text-primary/60 group-hover/feed:text-primary"
              )} />
              Community Feed
            </Button>
          </Link>

          {/* Visual separator between community link and auth actions */}
          <div className="hidden lg:block h-5 w-px bg-muted-foreground/50" />
          {isLoaded &&
            (isSignedIn ? (
              <div className="hidden lg:flex items-center gap-4">
                <Link href="/studio">
                  <Button variant="default" className={cn(
                      "group",
                      // Typography - Editorial Style
                      "text-xs font-bold uppercase tracking-[0.2em]",
                    )}>
                    <span className="relative opacity-90 group-hover:opacity-100 transition-opacity">
                      Open Studio
                      <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary-foreground/50 group-hover:w-full transition-all duration-300 ease-out" />
                    </span>
                    <ArrowRight className="h-4 w-4 ml-2 opacity-70 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                  </Button>
                </Link>
                <ClerkUserButton />
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <Link href="/sign-in" className="group">
                  {/* Elegant text link - matches "See Pricing" styling */}
                  <span className="relative inline-flex items-center text-sm font-medium text-foreground/80 hover:text-foreground transition-colors cursor-pointer py-2">
                    Sign in
                    {/* Animated underline */}
                    <span className="absolute bottom-1 left-0 w-0 h-px bg-foreground/40 group-hover:w-full transition-all duration-300 ease-out" />
                  </span>
                </Link>
                <Link href="/sign-up">
                  <Button variant="default" className="group">
                    Get Started Free
                    <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ))}

          {/* Mobile User Button - Visible only on mobile when signed in */}
          {isLoaded && isSignedIn && (
            <div className="lg:hidden flex items-center">
              <ClerkUserButton />
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="lg:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? (
              <ArrowRight className="h-5 w-5 rotate-90" />
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className="w-5 h-0.5 bg-current rounded-full" />
                <span className="w-5 h-0.5 bg-current rounded-full" />
                <span className="w-5 h-0.5 bg-current rounded-full" />
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-black/95 absolute top-full left-0 right-0 p-6 flex flex-col gap-4 animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-2">
            <Link
              href={pathname === "/" ? "#showcase" : "/#showcase"}
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleNavClick(e, pathname === "/" ? "#showcase" : "/#showcase");
              }}
            >
              <Button
                variant="ghost"
                className={cn("w-full justify-start text-lg", activeSection === "showcase" && "text-primary bg-white/5")}
              >
                Showcase
              </Button>
            </Link>
            <Link
              href={pathname === "/" ? "#compare" : "/#compare"}
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleNavClick(e, pathname === "/" ? "#compare" : "/#compare");
              }}
            >
              <Button
                variant="ghost"
                className={cn("w-full justify-start text-lg", activeSection === "compare" && "text-primary bg-white/5")}
              >
                Compare
              </Button>
            </Link>
            <Link
              href={pathname === "/" ? "#features" : "/#features"}
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleNavClick(e, pathname === "/" ? "#features" : "/#features");
              }}
            >
              <Button
                variant="ghost"
                className={cn("w-full justify-start text-lg", activeSection === "features" && "text-primary bg-white/5")}
              >
                Features
              </Button>
            </Link>
            <Link
              href={pathname === "/" ? "#models" : "/#models"}
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleNavClick(e, pathname === "/" ? "#models" : "/#models");
              }}
            >
              <Button
                variant="ghost"
                className={cn("w-full justify-start text-lg", activeSection === "models" && "text-primary bg-white/5")}
              >
                Models
              </Button>
            </Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className={cn("w-full justify-start text-lg", pathname === "/pricing" && "text-primary bg-white/5")}>
                Pricing
              </Button>
            </Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className={cn("w-full justify-start text-lg", pathname === "/about" && "text-primary bg-white/5")}>
                About
              </Button>
            </Link>
          </nav>

          {/* Community Feed - Soft glow portal (matches desktop aesthetic) */}
          <div className="pt-2">
            <Link href="/feed/public" onClick={() => setMobileMenuOpen(false)} className="group block">
              <Button
                variant="ghost"
                size="lg"
                className={cn(
                  // Base styling - glass-like with ember border (matches desktop)
                  "w-full border border-primary/20 bg-primary/5",
                  // Typography
                  "font-medium tracking-wide justify-center",
                  // Hover state
                  "hover:border-primary/40 hover:bg-primary/10",
                  // The ember glow effect - subtle
                  "shadow-[0_0_10px_-4px_var(--primary)] hover:shadow-[0_0_15px_-3px_var(--primary)]",
                  // Active state
                  pathname.startsWith("/feed") && "border-primary/60 bg-primary/15"
                )}
              >
                <Users className="h-4 w-4 mr-2 text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
                Community Feed
              </Button>
            </Link>
          </div>

          <div className="h-px bg-border my-2" />
          <div className="flex flex-col gap-3">
            {isSignedIn ? (
              <>
                <Link href="/studio" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full" size="lg">
                    Open Studio
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full" size="lg">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full" size="lg">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
