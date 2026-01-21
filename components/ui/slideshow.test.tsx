import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Slideshow } from "./slideshow";

// Mock NextImage
vi.mock("next/image", () => ({
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img data-testid="next-image" alt="" {...props} />
}));

// Mock hook
vi.mock("@/hooks/use-slideshow", () => ({
    useSlideshow: ({ totalSlides }: any) => ({
        activeIndex: 0,
        setActiveIndex: vi.fn(),
        next: vi.fn(),
        prev: vi.fn(),
        setIsHovering: vi.fn(),
    })
}));

describe("Slideshow", () => {
    const slides = [
        { key: "1", content: <div>Slide 1</div>, label: "Label 1", thumbnailSrc: "thumb1.jpg" },
        { key: "2", content: <div>Slide 2</div>, label: "Label 2", thumbnailSrc: "thumb2.jpg" },
    ];

    it("renders rendering null if no slides", () => {
        const { container } = render(<Slideshow slides={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders slides and content", () => {
        render(<Slideshow slides={slides} />);
        expect(screen.getByText("Slide 1")).toBeInTheDocument();
        expect(screen.getByText("Label 1")).toBeInTheDocument();
    });

    it("renders navigation arrows", () => {
        render(<Slideshow slides={slides} showArrows={true} />);
        expect(screen.getByLabelText("Previous slide")).toBeInTheDocument();
        expect(screen.getByLabelText("Next slide")).toBeInTheDocument();
    });

    it("renders thumbnails using NextImage", () => {
        render(<Slideshow slides={slides} showThumbnails={true} />);
        const images = screen.getAllByTestId("next-image");
        expect(images).toHaveLength(2);
        expect(images[0]).toHaveAttribute("src", "thumb1.jpg");
    });

    it("renders progress indicators", () => {
        render(<Slideshow slides={slides} showProgress={true} />);
        expect(screen.getByLabelText("Go to slide 1")).toBeInTheDocument();
        expect(screen.getByLabelText("Go to slide 2")).toBeInTheDocument();
    });
});
