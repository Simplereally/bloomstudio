import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LandingHeader } from "./landing-header";

// Mock Clerk
const mockUseUser = vi.fn(() => ({ isSignedIn: false, isLoaded: true }));
vi.mock("@clerk/nextjs", () => ({
  useUser: () => mockUseUser(),
}));

// Mock ClerkUserButton
vi.mock("@/components/clerk-user-button", () => ({
  ClerkUserButton: () => <div data-testid="clerk-user-button">User</div>,
}));

// Mock next/navigation
const mockPathname = vi.fn(() => "/");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock scroll spy hook
vi.mock("@/hooks/use-scroll-spy", () => ({
  useScrollSpy: () => "hero",
}));

describe("LandingHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/");
    mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: true });
    
    // Mock window scroll
    Object.defineProperty(globalThis, "scrollY", { value: 0, writable: true });
  });

  describe("rendering", () => {
    it("renders logo and brand name", () => {
      render(<LandingHeader />);
      
      expect(screen.getByAltText("Bloom Studio Logo")).toBeInTheDocument();
      expect(screen.getByText("Bloom Studio")).toBeInTheDocument();
    });

    it("renders desktop navigation links", () => {
      render(<LandingHeader />);
      
      expect(screen.getByRole("link", { name: /showcase/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /compare/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /features/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /models/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /pricing/i })).toBeInTheDocument();
    });

    it("renders Community Feed link", () => {
      render(<LandingHeader />);
      
      expect(screen.getAllByText("Community Feed").length).toBeGreaterThan(0);
    });
  });

  describe("auth states", () => {
    it("shows sign in and get started buttons when signed out", () => {
      mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: true });
      render(<LandingHeader />);
      
      expect(screen.getByText("Sign in")).toBeInTheDocument();
      expect(screen.getByText("Get Started Free")).toBeInTheDocument();
    });

    it("shows Open Studio button and user button when signed in", () => {
      mockUseUser.mockReturnValue({ isSignedIn: true, isLoaded: true });
      render(<LandingHeader />);
      
      expect(screen.getAllByText("Open Studio").length).toBeGreaterThan(0);
      // There are two ClerkUserButton instances: desktop and mobile
      expect(screen.getAllByTestId("clerk-user-button").length).toBeGreaterThan(0);
    });

    it("does not show auth buttons when not loaded", () => {
      mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: false });
      render(<LandingHeader />);
      
      expect(screen.queryByText("Sign in")).not.toBeInTheDocument();
      expect(screen.queryByText("Get Started Free")).not.toBeInTheDocument();
    });
  });

  describe("mobile menu", () => {
    it("toggles mobile menu on button click", () => {
      render(<LandingHeader />);
      
      // Find and click the mobile menu toggle button (hamburger icon)
      const toggleButtons = screen.getAllByRole("button");
      const mobileToggle = toggleButtons.find(btn => 
        btn.className.includes("lg:hidden") && btn.querySelector(".flex.flex-col")
      );
      
      expect(mobileToggle).toBeTruthy();
      if (mobileToggle) {
        fireEvent.click(mobileToggle);
        
        // After clicking, mobile menu content should be visible
        // The About link only appears in mobile menu
        expect(screen.getByRole("button", { name: /about/i })).toBeInTheDocument();
      }
    });
  });

  describe("navigation hrefs", () => {
    it("uses hash links when on landing page", () => {
      mockPathname.mockReturnValue("/");
      render(<LandingHeader />);
      
      const showcaseLink = screen.getByRole("link", { name: /showcase/i });
      expect(showcaseLink).toHaveAttribute("href", "#showcase");
    });

    it("uses full path with hash when on other pages", () => {
      mockPathname.mockReturnValue("/about");
      render(<LandingHeader />);
      
      const showcaseLink = screen.getByRole("link", { name: /showcase/i });
      expect(showcaseLink).toHaveAttribute("href", "/#showcase");
    });
  });

  describe("active states", () => {
    it("applies active styling when on pricing page", () => {
      mockPathname.mockReturnValue("/pricing");
      render(<LandingHeader />);
      
      const pricingLink = screen.getByRole("link", { name: /pricing/i });
      expect(pricingLink.querySelector("span")).toHaveClass("text-primary");
    });

    it("applies active styling to feed link when on feed page", () => {
      mockPathname.mockReturnValue("/feed/public");
      render(<LandingHeader />);
      
      // Find the Community Feed button and check it has active styling
      const feedButtons = screen.getAllByText("Community Feed");
      const desktopFeedBtn = feedButtons[0].closest("button");
      expect(desktopFeedBtn).toHaveClass("bg-primary/10");
    });
  });
});
