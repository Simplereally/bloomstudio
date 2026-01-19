import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BatchImageGrid } from "./batch-image-grid";

// Mock NextImage
vi.mock("next/image", () => ({ 
    default: ({ src, alt, ...props }: any) => (
        <img 
            src={src} 
            alt={alt} 
            data-testid="next-image" 
            {...props} 
        />
    )
}));

describe("BatchImageGrid", () => {
    const mockImages: any[] = [
        { _id: "1", url: "img1.jpg", prompt: "Prompt 1" },
        { _id: "2", url: "img2.jpg", prompt: "Prompt 2" },
    ];

    it("renders completed images", () => {
        render(
            <BatchImageGrid 
                images={mockImages} 
                totalCount={2} 
                completedCount={2} 
                isProcessing={false} 
            />
        );
        expect(screen.getAllByTestId("next-image")).toHaveLength(2);
        expect(screen.getByTestId("batch-image-1")).toBeInTheDocument();
        expect(screen.getByTestId("batch-image-2")).toBeInTheDocument();
    });

    it("renders empty state", () => {
        render(
            <BatchImageGrid 
                images={[]} 
                totalCount={0} 
                completedCount={0} 
                isProcessing={false} 
            />
        );
        expect(screen.getByText("No images generated yet")).toBeInTheDocument();
    });

    it("renders pending placeholders when processing", () => {
        // 2 completed, total 5. So 3 pending.
        render(
            <BatchImageGrid 
                images={mockImages} 
                totalCount={5} 
                completedCount={2} 
                isProcessing={true} 
            />
        );
        
        // Should show images
        expect(screen.getAllByTestId("next-image")).toHaveLength(2);
        
        // Should show placeholders. pendingSlots = min(3, 8) = 3
        expect(screen.getByTestId("batch-pending-0")).toBeInTheDocument();
        expect(screen.getByTestId("batch-pending-1")).toBeInTheDocument();
        expect(screen.getByTestId("batch-pending-2")).toBeInTheDocument();
        
        // Verify text in placeholder
        expect(screen.getByText("Generating...")).toBeInTheDocument();
    });

    it("handles image clicks", () => {
        const onImageClick = vi.fn();
        render(
            <BatchImageGrid 
                images={mockImages} 
                totalCount={2} 
                completedCount={2} 
                isProcessing={false} 
                onImageClick={onImageClick} 
            />
        );
        
        fireEvent.click(screen.getByTestId("batch-image-1"));
        expect(onImageClick).toHaveBeenCalledWith(mockImages[0]);
    });

    it("caps pending placeholders at 8", () => {
        // 0 completed, total 20. 20 pending. Cap at 8.
        render(
            <BatchImageGrid 
                images={[]} 
                totalCount={20} 
                completedCount={0} 
                isProcessing={true} 
            />
        );
        
        // Check for 8 placeholders
        const placeholders = screen.getAllByTestId(/batch-pending-/);
        expect(placeholders).toHaveLength(8);
    });
});
