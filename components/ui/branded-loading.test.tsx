import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BrandedLoading from "./branded-loading";

describe("BrandedLoading", () => {
    it("renders correctly", () => {
        render(<BrandedLoading />);
        
        // Logo
        const logo = screen.getByAltText("Bloom Studio Logo");
        expect(logo).toBeInTheDocument();
        expect(logo).toHaveAttribute("src", expect.stringMatching(/icon\.png/));

        // Text
        expect(screen.getByText("Bloom Studio")).toBeInTheDocument();
    });

    it("renders loading bar", () => {
        const { container } = render(<BrandedLoading />);
        // Use a more specific selector strategy or data-testid if available
        // But based on class structure:
        const loadingBar = container.querySelector(".animate-loading-bar");
        expect(loadingBar).toBeInTheDocument();
    });

    it("renders particles", () => {
        const { container } = render(<BrandedLoading />);
        const particles = container.querySelectorAll(".absolute.rounded-full.bg-primary");
        // We expect 16 particles
        expect(particles.length).toBe(16);
    });
});
