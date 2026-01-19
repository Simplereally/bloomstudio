import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UploadProgress } from "./upload-progress";

// Mock UI components
vi.mock("@/components/ui/progress", () => ({ 
    Progress: ({ value }: any) => <div data-testid="progress" data-value={value} /> 
}));
vi.mock("@/components/ui/button", () => ({ 
    Button: (props: any) => <button data-testid="cancel-button" {...props} /> 
}));

describe("UploadProgress", () => {
    it("renders filename and progress text", () => {
        render(<UploadProgress filename="image.jpg" progress={45} />);
        expect(screen.getByText("image.jpg")).toBeInTheDocument();
        expect(screen.getByText("45%")).toBeInTheDocument();
        // Check progress bar value
        expect(screen.getByTestId("progress")).toHaveAttribute("data-value", "45");
    });

    it("renders cancel button when onCancel provided and progress < 100", () => {
        const onCancel = vi.fn();
        render(<UploadProgress filename="test.png" progress={50} onCancel={onCancel} />);
        
        const btn = screen.getByTestId("cancel-button");
        expect(btn).toBeInTheDocument();
        
        fireEvent.click(btn);
        expect(onCancel).toHaveBeenCalled();
    });

    it("hides cancel button when progress is 100%", () => {
        render(<UploadProgress filename="done.png" progress={100} onCancel={() => {}} />);
        expect(screen.queryByTestId("cancel-button")).not.toBeInTheDocument();
    });

    it("hides cancel button when onCancel not provided", () => {
        render(<UploadProgress filename="uploading.png" progress={50} />);
        expect(screen.queryByTestId("cancel-button")).not.toBeInTheDocument();
    });
});
