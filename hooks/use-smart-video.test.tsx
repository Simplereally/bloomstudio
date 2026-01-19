import { render, act, renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSmartVideo } from "./use-smart-video";
import React from "react";

describe("useSmartVideo", () => {
  let observerCallback: (entries: Partial<IntersectionObserverEntry>[]) => void;
  const mockDisconnect = vi.fn();
  const mockObserve = vi.fn();

  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn().mockImplementation(function (this: any, callback: any) {
        observerCallback = callback;
        this.observe = mockObserve;
        this.disconnect = mockDisconnect;
        this.unobserve = vi.fn();
      })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("should start with shouldLoad=true if lazy=false", () => {
    const { result } = renderHook(() => useSmartVideo({ lazy: false }));
    expect(result.current.shouldLoad).toBe(true);
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("should start with shouldLoad=true if priority=true", () => {
    const { result } = renderHook(() => useSmartVideo({ priority: true }));
    expect(result.current.shouldLoad).toBe(true);
  });

  it("should start with shouldLoad=false if lazy=true and priority=false", () => {
    const { result } = renderHook(() => useSmartVideo({ lazy: true, priority: false }));
    expect(result.current.shouldLoad).toBe(false);
  });

  it("should set shouldLoad=true when element intersects", () => {
    function TestComponent() {
      const { videoRef, shouldLoad } = useSmartVideo({ lazy: true });
      return <video ref={videoRef} data-testid="video" data-shouldload={shouldLoad} />;
    }

    render(<TestComponent />);
    
    // The effect should have run and called observe because the ref is attached
    expect(mockObserve).toHaveBeenCalled();

    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    const video = document.querySelector('[data-testid="video"]');
    expect(video?.getAttribute("data-shouldload")).toBe("true");
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("should disconnect observer on unmount", () => {
    function TestComponent() {
      const { videoRef } = useSmartVideo({ lazy: true });
      return <video ref={videoRef} />;
    }

    const { unmount } = render(<TestComponent />);
    expect(mockObserve).toHaveBeenCalled();
    
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
