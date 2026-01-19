import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useScrollSpy } from "./use-scroll-spy";

describe("useScrollSpy", () => {
  beforeEach(() => {
    // Reset window properties
    vi.stubGlobal("window", {
      scrollY: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      history: {
        replaceState: vi.fn(),
      },
      location: {
        hash: "",
        pathname: "/",
        search: "",
      },
      undefined: false, // Ensure typeof window !== 'undefined'
    });
    
    // Mock document.getElementById
    vi.spyOn(document, "getElementById").mockImplementation((id: string) => {
      // Simulate elements based on ID format "section-X" where X is offset/height
      if (id.startsWith("section-")) {
        const index = parseInt(id.split("-")[1]);
        return {
          offsetTop: (index + 1) * 500, // 500, 1000, 1500 (starts AFTER 0)
          offsetHeight: 500,
        } as HTMLElement;
      }
      return null;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should initialize with no active section", () => {
    const { result } = renderHook(() => useScrollSpy(["section-0", "section-1"]));
    expect(result.current).toBeNull();
  });

  it("should detect active section on scroll", () => {
    // We need to capture the scroll handler
    let scrollHandler: (() => void) | undefined;
    vi.mocked(window.addEventListener).mockImplementation((event, handler) => {
      if (event === "scroll") {
        scrollHandler = handler as () => void;
      }
    });

    const { result } = renderHook(() => useScrollSpy(["section-0", "section-1", "section-2"], 0));
    
    // Trigger initial check
    expect(scrollHandler).toBeDefined();

    // Scroll to section 1 (starts at 1000)
    act(() => {
      window.scrollY = 1100;
      if (scrollHandler) scrollHandler();
    });

    expect(result.current).toBe("section-1");
    expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "/#section-1");
  });

  it("should update URL hash when section changes", () => {
    let scrollHandler: (() => void) | undefined;
    vi.mocked(window.addEventListener).mockImplementation((event, handler) => {
      if (event === "scroll") {
        scrollHandler = handler as () => void;
      }
    });

    const { result } = renderHook(() => useScrollSpy(["section-0", "section-1"], 0));

    // Scroll to section 0 (starts at 500)
    act(() => {
      window.scrollY = 600;
      if (scrollHandler) scrollHandler();
    });

    expect(result.current).toBe("section-0");
    expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "/#section-0");

    // Scroll to section 1 (starts at 1000)
    act(() => {
      window.scrollY = 1100;
      if (scrollHandler) scrollHandler();
    });

    expect(result.current).toBe("section-1");
    expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "/#section-1");
  });

  it("should clear active section when scrolling past all sections", () => {
    let scrollHandler: (() => void) | undefined;
    vi.mocked(window.addEventListener).mockImplementation((event, handler) => {
        if (event === "scroll") {
          scrollHandler = handler as () => void;
        }
    });

    // Initialize with section-0 active
    vi.stubGlobal("scrollY", 600); // Set initial global scrollY
    
    // renderHook will run initial effect check
    const { result } = renderHook(() => useScrollSpy(["section-0"], 0));

    // Ensure it picks up initial state if effect runs on mount
    
    // Manually trigger scroll to be safe
    act(() => {
        window.scrollY = 600;
        if (scrollHandler) scrollHandler();
    });
    expect(result.current).toBe("section-0");

    // Scroll way past (start 500, height 500 -> 1000) -> 2000 is past
    
    // Simulate current state having the hash
    vi.mocked(window.location).hash = "#section-0";
    
    act(() => {
        window.scrollY = 2000;
        if (scrollHandler) scrollHandler();
    });

    expect(result.current).toBeNull();
    // It should clear hash
    expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "/");
  });
});
