import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SmartVideo } from "./smart-video";
import { useSmartVideo } from "@/hooks/use-smart-video";

// Mock the hook
vi.mock("@/hooks/use-smart-video", () => ({
  useSmartVideo: vi.fn(),
}));

describe("SmartVideo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render video with src when shouldLoad is true", () => {
    vi.mocked(useSmartVideo).mockReturnValue({
      videoRef: { current: null },
      shouldLoad: true,
    });

    const { container } = render(<SmartVideo src="test-video.mp4" />);
    const video = container.querySelector("video");
    expect(video?.getAttribute("src")).toBe("test-video.mp4");
  });

  it("should render video without src when shouldLoad is false", () => {
    vi.mocked(useSmartVideo).mockReturnValue({
      videoRef: { current: null },
      shouldLoad: false,
    });

    const { container } = render(<SmartVideo src="test-video.mp4" />);
    const video = container.querySelector("video");
    
    expect(video?.getAttribute("src")).toBeNull();
    expect(video).toHaveClass("bg-black/10");
  });

  it("should have correct src when shouldLoad is true", () => {
    vi.mocked(useSmartVideo).mockReturnValue({
      videoRef: { current: null },
      shouldLoad: true,
    });

    const { container } = render(<SmartVideo src="test-video.mp4" />);
    const video = container.querySelector("video");
    
    expect(video?.getAttribute("src")).toBe("test-video.mp4");
  });

  it("should set preload auto when priority is true", () => {
    vi.mocked(useSmartVideo).mockReturnValue({
      videoRef: { current: null },
      shouldLoad: true,
    });

    const { container } = render(<SmartVideo src="test-video.mp4" priority />);
    const video = container.querySelector("video");
    
    expect(video?.getAttribute("preload")).toBe("auto");
    expect(useSmartVideo).toHaveBeenCalledWith(expect.objectContaining({ priority: true }));
  });

  it("should set preload metadata by default", () => {
    vi.mocked(useSmartVideo).mockReturnValue({
      videoRef: { current: null },
      shouldLoad: true,
    });

    const { container } = render(<SmartVideo src="test-video.mp4" />);
    const video = container.querySelector("video");
    
    expect(video?.getAttribute("preload")).toBe("metadata");
  });

  it("should pass other props to the video element", () => {
    vi.mocked(useSmartVideo).mockReturnValue({
      videoRef: { current: null },
      shouldLoad: true,
    });

    const { container } = render(<SmartVideo src="test-video.mp4" loop muted playsInline />);
    const video = container.querySelector("video");
    
    expect(video).toHaveProperty("loop", true);
    expect(video).toHaveProperty("muted", true);
    expect(video).toHaveProperty("playsInline", true);
  });
});
