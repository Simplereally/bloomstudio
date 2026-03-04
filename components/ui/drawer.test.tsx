/**
 * @vitest-environment jsdom
 *
 * Tests for the Drawer component's pointer-events cleanup behavior.
 *
 * Captures the "orphaned overlay" bug where opening a lightbox (Radix Dialog)
 * inside a drawer (vaul), interacting, then closing both layers leaves
 * `pointer-events: none` stuck on `<body>` — making the entire page unclickable.
 *
 * The fix lives in Drawer's `handleOpenChange` wrapper which schedules a
 * `requestAnimationFrame` cleanup on close.
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------------------
// We mock vaul's DrawerPrimitive so we can control open/close in JSDOM without
// needing the full vaul + Radix portal machinery, while still exercising the
// Drawer wrapper's onOpenChange interception logic.
// ---------------------------------------------------------------------------

let capturedOnOpenChange: ((open: boolean) => void) | undefined;

vi.mock("vaul", () => {
  const DrawerRoot = ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    [key: string]: unknown;
  }) => {
    // Capture the wrapped onOpenChange so tests can invoke it.
    // Keep this in an effect so render stays pure under React 19 lint rules.
    React.useEffect(() => {
      capturedOnOpenChange = onOpenChange;
    }, [onOpenChange]);
    // Use a non-dialog role so the cleanup guard's query
    // (`[data-state="open"][role="dialog"]`) doesn't match the drawer itself.
    // In real vaul, the drawer DOM is removed before the rAF fires because
    // React reconciliation is synchronous. Our mock mirrors that by
    // returning null when open is false.
    return open ? (
      <div data-testid="vaul-drawer-root" data-state="open">
        {children}
      </div>
    ) : null;
  };

  return {
    Drawer: {
      Root: DrawerRoot,
      Trigger: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
        <button data-testid="vaul-trigger" {...props}>{children}</button>
      ),
      Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      Close: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
        <button data-testid="vaul-close" {...props}>{children}</button>
      ),
      Overlay: (props: Record<string, unknown>) => (
        <div data-testid="vaul-overlay" {...props} />
      ),
      Content: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
        <div data-testid="vaul-content" {...props}>{children}</div>
      ),
      Title: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
        <h2 {...props}>{children}</h2>
      ),
      Description: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
        <p {...props}>{children}</p>
      ),
    },
  };
});

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "./drawer";

// ---------------------------------------------------------------------------
// Test harness: simulates a page with a drawer containing a "lightbox" dialog
// and a button outside the drawer that should remain clickable.
// ---------------------------------------------------------------------------

function PageWithDrawerAndLightbox() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  return (
    <div>
      {/* A button that lives outside the drawer — must always be clickable */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        data-testid="open-drawer-btn"
      >
        Open Drawer
      </button>

      <button
        type="button"
        onClick={() => {
          /* side-effect we can assert on */
        }}
        data-testid="outside-button"
      >
        Outside Action
      </button>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>History</DrawerTitle>
          </DrawerHeader>

          {/* Simulated image thumbnail inside the drawer */}
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            data-testid="open-lightbox-btn"
          >
            View Image
          </button>

          {/* Simulated copy-prompt action */}
          <button type="button" data-testid="copy-prompt-btn">
            Copy Prompt
          </button>

          {/* Simulated lightbox (a nested dialog) */}
          {lightboxOpen && (
            <div
              role="dialog"
              data-state="open"
              data-testid="lightbox-dialog"
            >
              <p>Lightbox Preview</p>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                data-testid="close-lightbox-btn"
              >
                Close Lightbox
              </button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Drawer pointer-events cleanup (orphaned overlay bug)", () => {
  let rafCallbacks: Array<FrameRequestCallback>;
  let originalRaf: typeof requestAnimationFrame;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnOpenChange = undefined;

    // Reset body styles
    document.body.style.pointerEvents = "";

    // Intercept requestAnimationFrame so we can flush it synchronously
    rafCallbacks = [];
    originalRaf = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    }) as typeof requestAnimationFrame;
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRaf;
    document.body.style.pointerEvents = "";
    // Remove any lingering dialog elements from body
    document.querySelectorAll('[role="dialog"]').forEach((el) => {
      if (el.parentNode === document.body) {
        el.remove();
      }
    });
  });

  /** Flush all queued rAF callbacks */
  function flushRaf() {
    const pending = [...rafCallbacks];
    rafCallbacks = [];
    for (const cb of pending) {
      cb(performance.now());
    }
  }

  it("clears pointer-events on body after drawer closes when no dialogs remain", () => {
    const onOpenChange = vi.fn();
    render(
      <Drawer open={true} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerTitle>Test Drawer</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );

    // Simulate the Radix/vaul bug: body has pointer-events: none from the modal layer
    document.body.style.pointerEvents = "none";

    // The drawer's wrapped onOpenChange should have been captured
    expect(capturedOnOpenChange).toBeDefined();

    // Simulate closing the drawer
    act(() => {
      capturedOnOpenChange!(false);
    });

    // The original callback should have been called
    expect(onOpenChange).toHaveBeenCalledWith(false);

    // Before rAF fires, body still has pointer-events: none
    expect(document.body.style.pointerEvents).toBe("none");

    // Flush the rAF cleanup
    act(() => {
      flushRaf();
    });

    // After cleanup, body should be interactive again
    expect(document.body.style.pointerEvents).toBe("");
  });

  it("does NOT clear pointer-events when an open dialog still exists in the DOM", () => {
    const onOpenChange = vi.fn();
    render(
      <Drawer open={true} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerTitle>Test Drawer</DrawerTitle>
          {/* A nested dialog that's still open */}
          <div role="dialog" data-state="open" data-testid="still-open-dialog">
            Lightbox
          </div>
        </DrawerContent>
      </Drawer>,
    );

    document.body.style.pointerEvents = "none";

    // Close the drawer
    act(() => {
      capturedOnOpenChange!(false);
    });

    // Flush rAF — but the open dialog is still in DOM
    // Note: our mock renders children when open=true, so the dialog element
    // still exists during the rAF since we haven't re-rendered yet
    act(() => {
      flushRaf();
    });

    // pointer-events should remain "none" because the query finds the open dialog
    // (This matches the guard: `document.querySelector('[data-state="open"][role="dialog"]')`)
    expect(document.body.style.pointerEvents).toBe("none");
  });

  it("does not schedule cleanup when drawer opens (only on close)", () => {
    const onOpenChange = vi.fn();
    render(
      <Drawer open={false} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerTitle>Test Drawer</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );

    // Capture the handler (even though drawer is closed, mock still captures)
    expect(capturedOnOpenChange).toBeDefined();

    // Simulate opening
    act(() => {
      capturedOnOpenChange!(true);
    });

    // No rAF should be queued for open
    expect(rafCallbacks).toHaveLength(0);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("works without an onOpenChange callback", () => {
    render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerTitle>No callback drawer</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );

    document.body.style.pointerEvents = "none";

    // Should not throw even without onOpenChange
    act(() => {
      capturedOnOpenChange!(false);
    });

    act(() => {
      flushRaf();
    });

    expect(document.body.style.pointerEvents).toBe("");
  });

  describe("full user flow: drawer → lightbox → copy → close all", () => {
    it("page remains interactive after opening lightbox inside drawer, interacting, and closing both", async () => {
      const user = userEvent.setup();
      // Restore real rAF for this integration-style test
      globalThis.requestAnimationFrame = originalRaf;

      render(<PageWithDrawerAndLightbox />);

      // Step 1: Open the drawer
      await user.click(screen.getByRole("button", { name: /open drawer/i }));

      // Drawer should now be visible
      expect(screen.getByText("History")).toBeInTheDocument();

      // Step 2: Open the lightbox inside the drawer
      await user.click(screen.getByRole("button", { name: /view image/i }));

      // Lightbox should be visible
      expect(screen.getByText("Lightbox Preview")).toBeInTheDocument();

      // Step 3: Interact with the drawer (copy prompt)
      await user.click(screen.getByRole("button", { name: /copy prompt/i }));

      // Step 4: Close the lightbox
      await user.click(screen.getByRole("button", { name: /close lightbox/i }));

      await waitFor(() => {
        expect(screen.queryByTestId("lightbox-dialog")).not.toBeInTheDocument();
      });

      // Step 5: Simulate body pointer-events stuck (the Radix bug)
      document.body.style.pointerEvents = "none";

      // Step 6: Close the drawer (via the captured onOpenChange)
      act(() => {
        capturedOnOpenChange!(false);
      });

      // Step 7: Wait for rAF cleanup to run
      await waitFor(() => {
        expect(document.body.style.pointerEvents).not.toBe("none");
      });

      // Step 8: Verify the outside button is clickable (not blocked)
      const outsideButton = screen.getByRole("button", { name: /outside action/i });
      expect(outsideButton).toBeInTheDocument();

      // The button should not have pointer-events: none blocking it
      // In a real browser, this would mean the user can click it
      expect(document.body.style.pointerEvents).toBe("");
    });

    it("outside button remains clickable when pointer-events are properly cleaned up", async () => {
      const handleClick = vi.fn();

      function PageWithClickTracker() {
        const [drawerOpen, setDrawerOpen] = React.useState(false);

        return (
          <div>
            <button
              type="button"
              onClick={handleClick}
              data-testid="tracked-button"
            >
              Tracked Button
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
            >
              Open Drawer
            </button>

            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerContent>
                <DrawerTitle>History</DrawerTitle>
              </DrawerContent>
            </Drawer>
          </div>
        );
      }

      const user = userEvent.setup();
      // Restore real rAF
      globalThis.requestAnimationFrame = originalRaf;

      render(<PageWithClickTracker />);

      // Open and close drawer
      await user.click(screen.getByRole("button", { name: /open drawer/i }));

      // Simulate the Radix bug leaving pointer-events: none
      document.body.style.pointerEvents = "none";

      // Close drawer via captured handler
      act(() => {
        capturedOnOpenChange!(false);
      });

      // Wait for cleanup
      await waitFor(() => {
        expect(document.body.style.pointerEvents).toBe("");
      });

      // Click the tracked button — should work now
      await user.click(screen.getByRole("button", { name: /tracked button/i }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("edge cases", () => {
    it("handles rapid open/close cycles without leaving orphaned styles", () => {
      const onOpenChange = vi.fn();
      render(
        <Drawer open={true} onOpenChange={onOpenChange}>
          <DrawerContent>
            <DrawerTitle>Rapid test</DrawerTitle>
          </DrawerContent>
        </Drawer>,
      );

      document.body.style.pointerEvents = "none";

      // Rapid close → open → close
      act(() => {
        capturedOnOpenChange!(false);
        capturedOnOpenChange!(true);
        capturedOnOpenChange!(false);
      });

      // Flush all queued rAFs (only close calls queue rAFs)
      act(() => {
        flushRaf();
      });

      // Body should be clean since no dialog remains open
      expect(document.body.style.pointerEvents).toBe("");
    });

    it("does not touch pointer-events if body already has them cleared", () => {
      const onOpenChange = vi.fn();
      render(
        <Drawer open={true} onOpenChange={onOpenChange}>
          <DrawerContent>
            <DrawerTitle>Already clean</DrawerTitle>
          </DrawerContent>
        </Drawer>,
      );

      // Body is already clean
      document.body.style.pointerEvents = "";

      act(() => {
        capturedOnOpenChange!(false);
      });

      act(() => {
        flushRaf();
      });

      // Should still be clean (no side effects)
      expect(document.body.style.pointerEvents).toBe("");
    });

    it("does not clear pointer-events when body has a non-none value", () => {
      const onOpenChange = vi.fn();
      render(
        <Drawer open={true} onOpenChange={onOpenChange}>
          <DrawerContent>
            <DrawerTitle>Custom pointer-events</DrawerTitle>
          </DrawerContent>
        </Drawer>,
      );

      // Some other code set pointer-events to auto
      document.body.style.pointerEvents = "auto";

      act(() => {
        capturedOnOpenChange!(false);
      });

      act(() => {
        flushRaf();
      });

      // Should NOT touch it — the guard only clears "none"
      expect(document.body.style.pointerEvents).toBe("auto");
    });
  });
});
