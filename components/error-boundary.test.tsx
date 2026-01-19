import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ErrorBoundary, useErrorBoundary } from "./error-boundary";
import React from "react";
import * as libErrors from "@/lib/errors";

// Mock the lib/errors
vi.mock("@/lib/errors", () => ({
  isPollinationsApiError: vi.fn(),
  getErrorMessage: vi.fn((err) => err.message),
}));

describe("ErrorBoundary", () => {
  const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
      throw new Error("Test Error");
    }
    return <div>Normal Content</div>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Prevent vitest from logging the error to console during expected failures
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should render children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Test Child</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("should catch errors and render default fallback", () => {
    vi.mocked(libErrors.isPollinationsApiError).mockReturnValue(false);

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test Error")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("should render custom fallback when provided", () => {
    const CustomFallback = ({ error, resetErrorBoundary }: any) => (
      <div>
        <p>Custom Error: {error.message}</p>
        <button onClick={resetErrorBoundary}>Reset</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom Error: Test Error")).toBeInTheDocument();
    const btn = screen.getByText("Reset");
    fireEvent.click(btn);
    // After reset, it should try to render children again (which might throw again if not handled)
  });

  it("should call onError when an error is caught", () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
  });

  it("should reset when resetKeys change", () => {
    const onReset = vi.fn();
    const { rerender } = render(
      <ErrorBoundary resetKeys={["initial"]} onReset={onReset}>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Change reset keys
    rerender(
      <ErrorBoundary resetKeys={["changed"]} onReset={onReset}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(onReset).toHaveBeenCalled();
    expect(screen.getByText("Normal Content")).toBeInTheDocument();
  });

  it("should render specific UI for API errors", () => {
    const apiError = new Error("Auth Failed") as any;
    apiError.isAuthError = true;
    apiError.requestId = "req-123";
    
    vi.mocked(libErrors.isPollinationsApiError).mockReturnValue(true);

    render(
      <ErrorBoundary>
        <div ref={() => { throw apiError }} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Authentication Required")).toBeInTheDocument();
    expect(screen.getByText("Request ID: req-123")).toBeInTheDocument();
  });

  it("should show field errors if present in API error", () => {
    const apiError = new Error("Validation Failed") as any;
    apiError.isValidationError = true;
    apiError.hasFieldErrors = true;
    apiError.flatFieldErrors = ["Prompt is too long", "Width must be positive"];
    
    vi.mocked(libErrors.isPollinationsApiError).mockReturnValue(true);

    render(
      <ErrorBoundary>
        <div ref={() => { throw apiError }} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Invalid Parameters")).toBeInTheDocument();
    expect(screen.getByText("Prompt is too long")).toBeInTheDocument();
    expect(screen.getByText("Width must be positive")).toBeInTheDocument();
  });
});

describe("useErrorBoundary", () => {
  it("should show boundary when showBoundary is called", () => {
    const TestComponent = () => {
      const { showBoundary } = useErrorBoundary();
      return <button onClick={() => showBoundary(new Error("Hook Error"))}>Trigger</button>;
    };

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText("Trigger"));
    expect(screen.getByText("Hook Error")).toBeInTheDocument();
  });
});
