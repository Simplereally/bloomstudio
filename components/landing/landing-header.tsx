"use client";

import { ClerkUserButton } from "@/components/clerk-user-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useScrollSpy } from "@/hooks/use-scroll-spy";

const LANDING_SECTIONS = ["hero", "showcase", "compare", "features", "models", "get-started"];

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
        scrolled ? "py-1.5 bg-black/60 border-white/5 shadow-sm" : "py-6 bg-black/5 border-transparent shadow-none",
        mobileMenuOpen && "bg-black/90 border-white/10"
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary font-brand tracking-tight -skew-x-6 whitespace-nowrap">Bloom Studio</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href={pathname === "/" ? "#showcase" : "/#showcase"}
              onClick={(e) => handleNavClick(e, pathname === "/" ? "#showcase" : "/#showcase")}
            >
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-foreground/70 hover:text-foreground hover:bg-white/5 transition-colors",
                  activeSection === "showcase" && "text-primary bg-white/5"
                )}
              >
                Showcase
              </Button>
            </Link>
            <Link
              href={pathname === "/" ? "#compare" : "/#compare"}
              onClick={(e) => handleNavClick(e, pathname === "/" ? "#compare" : "/#compare")}
            >
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-foreground/70 hover:text-foreground hover:bg-white/5 transition-colors",
                  activeSection === "compare" && "text-primary bg-white/5"
                )}
              >
                Compare
              </Button>
            </Link>
            <Link
              href={pathname === "/" ? "#features" : "/#features"}
              onClick={(e) => handleNavClick(e, pathname === "/" ? "#features" : "/#features")}
            >
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-foreground/70 hover:text-foreground hover:bg-white/5 transition-colors",
                  activeSection === "features" && "text-primary bg-white/5"
                )}
              >
                Features
              </Button>
            </Link>
            <Link
              href={pathname === "/" ? "#models" : "/#models"}
              onClick={(e) => handleNavClick(e, pathname === "/" ? "#models" : "/#models")}
            >
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-foreground/70 hover:text-foreground hover:bg-white/5 transition-colors",
                  activeSection === "models" && "text-primary bg-white/5"
                )}
              >
                Models
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-foreground/70 hover:text-foreground hover:bg-white/5",
                  pathname === "/pricing" && "text-primary bg-white/5"
                )}
              >
                Pricing
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isLoaded &&
            (isSignedIn ? (
              <div className="hidden md:flex items-center gap-4">
                <Link href="/studio">
                  <Button variant="default" className="group">
                    Open Studio
                    <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <ClerkUserButton />
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-foreground hover:bg-white/5">
                    Sign in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button variant="default" className="group">
                    Get Started Free
                    <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ))}

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
        <div className="md:hidden border-t border-white/10 bg-black/95 absolute top-full left-0 right-0 p-6 flex flex-col gap-4 animate-in slide-in-from-top-2">
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
          <div className="h-px bg-white/10 my-2" />
          <div className="flex flex-col gap-3">
            {isSignedIn ? (
              <>
                <Link href="/studio" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full" size="lg">
                    Open Studio
                  </Button>
                </Link>
                <div className="flex justify-center py-2">
                  <ClerkUserButton />
                </div>
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
