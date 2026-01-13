/**
 * Tests for the Pollinations OAuth callback page.
 * 
 * These tests focus on the security validation of the returnTo parameter
 * to prevent open-redirect attacks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PollinationsCallbackPage from "./page";

// Mock next/navigation
const mockPush = vi.fn();
const mockGet = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    useSearchParams: () => ({
        get: mockGet,
    }),
}));

// Mock pollen-auth
vi.mock("@/lib/pollen-auth", () => ({
    CALLBACK_KEY_PARAM: "api_key",
    storeApiKey: vi.fn(() => true),
    isValidApiKeyFormat: vi.fn((key: string) => key.startsWith("sk_")),
}));

// Mock sonner
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("PollinationsCallbackPage", () => {
    const originalLocation = window.location;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock window.location
        Object.defineProperty(window, "location", {
            value: {
                hash: "",
                pathname: "/auth/pollinations/callback",
                search: "",
                origin: "https://example.com",
            },
            writable: true,
        });

        // Mock window.history.replaceState
        vi.spyOn(window.history, "replaceState").mockImplementation(() => { });
    });

    afterEach(() => {
        Object.defineProperty(window, "location", {
            value: originalLocation,
            writable: true,
        });
        vi.restoreAllMocks();
    });

    describe("returnTo validation (isSafeReturnTo)", () => {
        it("should accept valid local paths", async () => {
            window.location.hash = "#api_key=sk_test123";
            mockGet.mockReturnValue("/studio");

            render(<PollinationsCallbackPage />);

            // Wait for processing to complete and countdown to trigger redirect
            await waitFor(() => {
                expect(screen.getByText(/Successfully Connected/i)).toBeInTheDocument();
            }, { timeout: 500 });

            // Simulate countdown completion
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/studio");
            }, { timeout: 5000 });
        });

        it("should accept nested local paths", async () => {
            window.location.hash = "#api_key=sk_test123";
            mockGet.mockReturnValue("/dashboard/settings/profile");

            render(<PollinationsCallbackPage />);

            await waitFor(() => {
                expect(screen.getByText(/Successfully Connected/i)).toBeInTheDocument();
            }, { timeout: 500 });

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/dashboard/settings/profile");
            }, { timeout: 5000 });
        });

        it("should reject absolute URLs and fall back to /studio", async () => {
            window.location.hash = "#api_key=sk_test123";
            mockGet.mockReturnValue("https://evil.com");

            render(<PollinationsCallbackPage />);

            await waitFor(() => {
                expect(screen.getByText(/Successfully Connected/i)).toBeInTheDocument();
            }, { timeout: 500 });

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/studio");
            }, { timeout: 5000 });
        });

        it("should reject protocol-relative URLs (//)", async () => {
            window.location.hash = "#api_key=sk_test123";
            mockGet.mockReturnValue("//evil.com");

            render(<PollinationsCallbackPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/studio");
            }, { timeout: 5000 });
        });

        it("should reject javascript: protocol", async () => {
            window.location.hash = "#api_key=sk_test123";
            mockGet.mockReturnValue("javascript:alert(1)");

            render(<PollinationsCallbackPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/studio");
            }, { timeout: 5000 });
        });

        it("should reject data: protocol", async () => {
            window.location.hash = "#api_key=sk_test123";
            mockGet.mockReturnValue("data:text/html,<script>alert(1)</script>");

            render(<PollinationsCallbackPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/studio");
            }, { timeout: 5000 });
        });

        it("should reject paths with @ (potential username in URL)", async () => {
            window.location.hash = "#api_key=sk_test123";
            mockGet.mockReturnValue("/@evil.com");

            render(<PollinationsCallbackPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/studio");
            }, { timeout: 5000 });
        });

        it("should reject paths with encoded slashes (%2f)", async () => {
            window.location.hash = "#api_key=sk_test123";
            mockGet.mockReturnValue("/%2f/evil.com");

            render(<PollinationsCallbackPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/studio");
            }, { timeout: 5000 });
        });

        it("should reject paths with encoded backslashes (%5c)", async () => {
            window.location.hash = "#api_key=sk_test123";
            mockGet.mockReturnValue("/%5c/evil.com");

            render(<PollinationsCallbackPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/studio");
            }, { timeout: 5000 });
        });

        it("should reject paths with backslashes (potential Windows-style redirect)", async () => {
            window.location.hash = "#api_key=sk_test123";
            mockGet.mockReturnValue("/\\evil.com");

            render(<PollinationsCallbackPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/studio");
            }, { timeout: 5000 });
        });

        it("should default to /studio when returnTo is null", async () => {
            window.location.hash = "#api_key=sk_test123";
            mockGet.mockReturnValue(null);

            render(<PollinationsCallbackPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/studio");
            }, { timeout: 5000 });
        });

        it("should default to /studio when returnTo is empty string", async () => {
            window.location.hash = "#api_key=sk_test123";
            mockGet.mockReturnValue("");

            render(<PollinationsCallbackPage />);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/studio");
            }, { timeout: 5000 });
        });
    });

    describe("URL hash clearing", () => {
        it("should preserve query string when clearing hash", async () => {
            window.location.hash = "#api_key=sk_test123";
            window.location.search = "?returnTo=/dashboard";

            render(<PollinationsCallbackPage />);

            await waitFor(() => {
                expect(window.history.replaceState).toHaveBeenCalledWith(
                    null,
                    "",
                    "/auth/pollinations/callback?returnTo=/dashboard"
                );
            }, { timeout: 500 });
        });

        it("should work correctly when there is no query string", async () => {
            window.location.hash = "#api_key=sk_test123";
            window.location.search = "";

            render(<PollinationsCallbackPage />);

            await waitFor(() => {
                expect(window.history.replaceState).toHaveBeenCalledWith(
                    null,
                    "",
                    "/auth/pollinations/callback"
                );
            }, { timeout: 500 });
        });
    });
});
