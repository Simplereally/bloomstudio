// @vitest-environment jsdom
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSetImageVisibility, useSetBulkVisibility } from "./use-set-visibility";
import { toast } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock dependencies
vi.mock("convex/react", () => ({
  useMutation: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/_server/actions/invalidation", () => ({
  invalidateVisibilityChange: vi.fn(),
}));

// Mock API
vi.mock("@/convex/_generated/api", () => ({
  api: {
    generatedImages: {
      setVisibility: "setVisibility",
      setBulkVisibility: "setBulkVisibility",
    },
  },
}));

import { useMutation as useConvexMutation } from "convex/react";
import { invalidateVisibilityChange } from "@/app/_server/actions/invalidation";

describe("useSetVisibility", () => {
    let queryClient: QueryClient;
    let mockSetVisibility: any;
    let mockSetBulkVisibility: any;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient();
        
        mockSetVisibility = vi.fn().mockResolvedValue(true);
        mockSetBulkVisibility = vi.fn().mockResolvedValue({ successCount: 1, errors: [] });
        
        (useConvexMutation as any).mockImplementation((mutation: any) => {
            if (mutation === "setVisibility") return mockSetVisibility;
            if (mutation === "setBulkVisibility") return mockSetBulkVisibility;
            return vi.fn();
        });
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    describe("useSetImageVisibility", () => {
        it("should call mutation and toast on success", async () => {
            const { result } = renderHook(() => useSetImageVisibility(), { wrapper });

            await act(async () => {
                await result.current.mutateAsync({ imageId: "id1" as any, visibility: "public" });
            });

            expect(mockSetVisibility).toHaveBeenCalledWith({ imageId: "id1", visibility: "public" });
            expect(toast.success).toHaveBeenCalledWith("Image marked as public");
            expect(invalidateVisibilityChange).toHaveBeenCalled();
        });

        it("should handle error", async () => {
            mockSetVisibility.mockRejectedValue(new Error("Failed"));
            const { result } = renderHook(() => useSetImageVisibility(), { wrapper });

            await act(async () => {
                try {
                await result.current.mutateAsync({ imageId: "id1" as any, visibility: "public" });
                } catch (e) {
                    // Ignore expected error
                }
            });

            expect(toast.error).toHaveBeenCalledWith("Failed to update visibility", expect.any(Object));
        });
    });
    
    describe("useSetBulkVisibility", () => {
        it("should call bulk mutation and toast on success", async () => {
             const { result } = renderHook(() => useSetBulkVisibility(), { wrapper });
             
             await act(async () => {
                 await result.current.mutateAsync({ imageIds: ["id1", "id2"] as any, visibility: "unlisted" });
             });
             
             expect(mockSetBulkVisibility).toHaveBeenCalledWith({ imageIds: ["id1", "id2"], visibility: "unlisted" });
             expect(toast.success).toHaveBeenCalledWith("1 image marked as private");
             expect(invalidateVisibilityChange).toHaveBeenCalled();
        });

        it("should handle mixed results", async () => {
             mockSetBulkVisibility.mockResolvedValue({ successCount: 1, errors: [{ imageId: "id2", error: "fail" }] });
             const { result } = renderHook(() => useSetBulkVisibility(), { wrapper });
             
             await act(async () => {
                 await result.current.mutateAsync({ imageIds: ["id1", "id2"] as any, visibility: "public" });
             });
             
             expect(toast.success).toHaveBeenCalledWith("1 image marked as public");
             expect(toast.error).toHaveBeenCalledWith("Failed to update 1 images");
        });
    });
});
