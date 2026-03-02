/**
 * @vitest-environment jsdom
 *
 * Tests for ReferenceImagePicker Component
 */
import { useDeleteReferenceImage } from "@/hooks/mutations/use-delete-image";
import { useUploadReference } from "@/hooks/mutations/use-upload-reference";
import { useReferenceImages } from "@/hooks/queries/use-reference-images";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import type { Id } from "@/convex/_generated/dataModel";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReferenceImagePicker } from "./reference-image-picker";
import { toast } from "sonner";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: ImageProps) => (
    <img src={typeof src === "string" ? src : "default" in src ? src.default.src : src.src} alt={alt} {...props} />
  ),
}));

// Mock hooks
vi.mock("@/hooks/queries/use-reference-images", () => ({
  useReferenceImages: vi.fn(),
}));

vi.mock("@/hooks/mutations/use-upload-reference", () => ({
  useUploadReference: vi.fn(),
}));

vi.mock("@/hooks/mutations/use-delete-image", () => ({
  useDeleteReferenceImage: vi.fn(),
}));

// Mock the browser modal
vi.mock("./reference-images-browser-modal", () => ({
  ReferenceImagesBrowserModal: ({ open, onSelect, onOpenChange, allowVideo }: { 
    open: boolean; 
    onSelect: (url: string) => void;
    onOpenChange: (open: boolean) => void;
    allowVideo?: boolean;
  }) => (
    open ? (
      <div data-testid="browser-modal" data-allow-video={allowVideo ? "true" : "false"}>
        <button onClick={() => onSelect("https://example.com/selected-from-modal.jpg")} data-testid="modal-select-button">
          Select Image
        </button>
        <button onClick={() => onOpenChange(false)} data-testid="modal-close-button">
          Close
        </button>
      </div>
    ) : null
  ),
}));

describe("ReferenceImagePicker", () => {
  const mockOnSelect = vi.fn();

  function createReferenceImageId(value: string): Id<"referenceImages"> {
    return value as unknown as Id<"referenceImages">;
  }

  const mockRecentImages: NonNullable<ReturnType<typeof useReferenceImages>> = [
    {
      _id: createReferenceImageId("1"),
      _creationTime: Date.now(),
      ownerId: "user_1",
      r2Key: "reference/1.jpg",
      url: "url1",
      filename: "1.jpg",
      contentType: "image/jpeg",
      sizeBytes: 123,
      width: 128,
      height: 128,
      createdAt: Date.now(),
    },
    {
      _id: createReferenceImageId("2"),
      _creationTime: Date.now(),
      ownerId: "user_1",
      r2Key: "reference/2.jpg",
      url: "url2",
      filename: "2.jpg",
      contentType: "image/jpeg",
      sizeBytes: 456,
      width: 128,
      height: 128,
      createdAt: Date.now(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useReferenceImages).mockReturnValue(mockRecentImages);
    vi.mocked(useUploadReference).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUploadReference>);
    vi.mocked(useDeleteReferenceImage).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteReferenceImage>);
  });

  it("renders upload button when no image selected", () => {
    render(<ReferenceImagePicker onSelect={mockOnSelect} />);
    expect(screen.getByText("Upload")).toBeInTheDocument();
  });

  it("renders selected image and clear button", () => {
    render(<ReferenceImagePicker selectedImage="selected-url" onSelect={mockOnSelect} />);
    expect(screen.getByAltText("Selected reference")).toBeInTheDocument();
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("calls onSelect when recent image is clicked", () => {
    render(<ReferenceImagePicker onSelect={mockOnSelect} />);
    const recentImages = screen.getAllByAltText("Reference image");
    fireEvent.click(recentImages[0]);
    expect(mockOnSelect).toHaveBeenCalledWith("url1");
  });

  it("calls onSelect with undefined when clear is clicked", () => {
    render(<ReferenceImagePicker selectedImage="url1" onSelect={mockOnSelect} />);
    fireEvent.click(screen.getByText("Clear"));
    expect(mockOnSelect).toHaveBeenCalledWith(undefined);
  });

  it("hides header when hideHeader is true", () => {
    render(<ReferenceImagePicker selectedImage="url1" onSelect={mockOnSelect} hideHeader={true} />);
    expect(screen.queryByText("Reference Image")).not.toBeInTheDocument();
    expect(screen.queryByText("Clear")).not.toBeInTheDocument();
  });

  it("shows error when file is too large", () => {
    render(<ReferenceImagePicker onSelect={mockOnSelect} />);

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();

    const largeFile = new File(["dummy content"], "large.png", { type: "image/png" });
    Object.defineProperty(largeFile, 'size', { value: 10 * 1024 * 1024 + 1 });

    fireEvent.change(input!, { target: { files: [largeFile] } });

    expect(toast.error).toHaveBeenCalledWith("File is too large. Maximum size is 10MB.");
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  describe("browse library button", () => {
    it("renders Browse Library button", () => {
      render(<ReferenceImagePicker onSelect={mockOnSelect} />);
      expect(screen.getByTestId("browse-references-button")).toBeInTheDocument();
      expect(screen.getByText("Browse Library")).toBeInTheDocument();
    });

    it("opens browser modal when Browse Library is clicked", () => {
      render(<ReferenceImagePicker onSelect={mockOnSelect} />);
      const browseButton = screen.getByTestId("browse-references-button");
      fireEvent.click(browseButton);
      expect(screen.getByTestId("browser-modal")).toBeInTheDocument();
    });

    it("passes allowVideo=false to the modal", () => {
      render(<ReferenceImagePicker onSelect={mockOnSelect} />);
      fireEvent.click(screen.getByTestId("browse-references-button"));
      const modal = screen.getByTestId("browser-modal");
      expect(modal).toHaveAttribute("data-allow-video", "false");
    });

    it("calls onSelect when image is selected from modal", () => {
      render(<ReferenceImagePicker onSelect={mockOnSelect} />);
      fireEvent.click(screen.getByTestId("browse-references-button"));
      fireEvent.click(screen.getByTestId("modal-select-button"));
      expect(mockOnSelect).toHaveBeenCalledWith("https://example.com/selected-from-modal.jpg");
    });

    it("closes modal after selecting from modal", () => {
      render(<ReferenceImagePicker onSelect={mockOnSelect} />);
      fireEvent.click(screen.getByTestId("browse-references-button"));
      expect(screen.getByTestId("browser-modal")).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId("modal-select-button"));
      expect(screen.queryByTestId("browser-modal")).not.toBeInTheDocument();
    });

    it("closes modal when close button is clicked", () => {
      render(<ReferenceImagePicker onSelect={mockOnSelect} />);
      fireEvent.click(screen.getByTestId("browse-references-button"));
      expect(screen.getByTestId("browser-modal")).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId("modal-close-button"));
      expect(screen.queryByTestId("browser-modal")).not.toBeInTheDocument();
    });

    it("is disabled when picker is disabled", () => {
      render(<ReferenceImagePicker onSelect={mockOnSelect} disabled={true} />);
      const browseButton = screen.getByTestId("browse-references-button");
      expect(browseButton).toBeDisabled();
    });
  });
});
