import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VideoSlideshow } from "./video-slideshow";

// Mock SmartVideo since it wraps video element logic
vi.mock("@/components/ui/smart-video", () => ({
    SmartVideo: (props: any) => <div data-testid="smart-video" {...props} />
}));

// Mock hooks
vi.mock("@/hooks/use-video-slideshow", () => ({
    useVideoSlideshow: ({ totalSlides }: any) => {
        // Simple state simulation for testing layout
        return {
            activeIndex: 0,
            setActiveIndex: vi.fn(),
            next: vi.fn(),
            prev: vi.fn(),
            setIsHovering: vi.fn()
        };
    }
}));

describe("VideoSlideshow", () => {
    const slides = [
        { key: "1", content: <div>Slide 1</div>, label: "Label 1", thumbnailSrc: "thumb1.mp4" },
        { key: "2", content: <div>Slide 2</div>, label: "Label 2", thumbnailSrc: "thumb2.mp4" },
    ];

    it("renders rendering null if no slides", () => {
        const { container } = render(<VideoSlideshow slides={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders slides and content", () => {
        render(<VideoSlideshow slides={slides} />);
        
        expect(screen.getByText("Slide 1")).toBeInTheDocument();
        expect(screen.getByText("Slide 2")).toBeInTheDocument();
        expect(screen.getByText("Label 1")).toBeInTheDocument();
    });

    it("renders navigation arrows", () => {
        render(<VideoSlideshow slides={slides} showArrows={true} />);
        
        expect(screen.getByLabelText("Previous slide")).toBeInTheDocument();
        expect(screen.getByLabelText("Next slide")).toBeInTheDocument();
    });

    it("renders thumbnails correctly", () => {
        render(<VideoSlideshow slides={slides} showThumbnails={true} />);
        
        const thumbnails = screen.getAllByTestId("smart-video");
        expect(thumbnails).toHaveLength(2);
        // Check first thumbnail src
        expect(thumbnails[0]).toHaveAttribute("src", "thumb1.mp4");
    });

    it("renders progress indicators", () => {
        render(<VideoSlideshow slides={slides} showProgress={true} />);
        
        expect(screen.getByLabelText("Go to slide 1")).toBeInTheDocument();
        expect(screen.getByLabelText("Go to slide 2")).toBeInTheDocument();
    });

    it("hides controls when specified", () => {
        render(<VideoSlideshow slides={slides} showArrows={false} showThumbnails={false} showProgress={false} />);
        
        expect(screen.queryByLabelText("Previous slide")).not.toBeInTheDocument();
        expect(screen.queryByTestId("smart-video")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("Go to slide 1")).not.toBeInTheDocument();
    });
});
