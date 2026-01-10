import { useEffect, useState } from "react";

/**
 * Hook to track the active section in view based on scroll position.
 * Also updates the URL hash dynamically as the user scrolls.
 * 
 * @param sectionIds Array of IDs to observe
 * @param offset Pixel offset from top to consider a section "active" (default: 100)
 */
export function useScrollSpy(sectionIds: string[], offset = 100) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    // We only want to run this on the landing page or pages that use these IDs
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + offset;

      // Find the current section
      const currentSection = sectionIds.find((id) => {
        const element = document.getElementById(id);
        if (!element) return false;

        const { offsetTop, offsetHeight } = element;
        return (
          scrollPosition >= offsetTop && 
          scrollPosition < offsetTop + offsetHeight
        );
      });

      if (currentSection && currentSection !== activeSection) {
        setActiveSection(currentSection);
        
        // Update URL hash without jumping the page or adding to history
        // We use replaceState to keep the history clean
        const newHash = `#${currentSection}`;
        if (window.location.hash !== newHash) {
          window.history.replaceState(
            null, 
            "", 
            window.location.pathname + window.location.search + newHash
          );
        }
      } else if (!currentSection && activeSection) {
        // If we scrolled past all observed sections (e.g. back to top)
        setActiveSection(null);
        if (window.location.hash) {
          window.history.replaceState(
            null, 
            "", 
            window.location.pathname + window.location.search
          );
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sectionIds, offset, activeSection]);

  return activeSection;
}
