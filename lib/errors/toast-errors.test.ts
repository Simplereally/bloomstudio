import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  showErrorToast, 
  showSuccessToast, 
  showInfoToast, 
  showLoadingToast,
  updateToastSuccess,
  updateToastError,
  dismissToast,
  showRateLimitToast,
  showAuthRequiredToast,
  createToastErrorHandler
} from "./toast-errors";
import { toast } from "sonner";
import * as libErrors from "@/lib/errors";

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock lib/errors partially
vi.mock("@/lib/errors", async () => {
    const actual = await vi.importActual("@/lib/errors") as any;
    return {
        ...actual,
        isPollinationsApiError: vi.fn(),
        getErrorMessage: vi.fn((err) => typeof err === 'string' ? err : (err as Error).message),
    };
});

describe("toast-errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset implementations to default
    vi.mocked(libErrors.getErrorMessage).mockImplementation((err) => typeof err === 'string' ? err : (err as Error).message);
    vi.mocked(libErrors.isPollinationsApiError).mockReturnValue(false);
  });

  describe("showErrorToast", () => {
    it("should call toast.error for generic errors", () => {
      showErrorToast(new Error("Generic Error"));
      expect(toast.error).toHaveBeenCalledWith("Generic Error", expect.objectContaining({
        duration: 5000
      }));
    });

    it("should call toast.warning for unauthorized errors", () => {
      const authError = { code: libErrors.ApiErrorCodeConst.UNAUTHORIZED };
      vi.mocked(libErrors.isPollinationsApiError).mockReturnValue(true);
      vi.mocked(libErrors.getErrorMessage).mockReturnValueOnce("Auth Required");
      
      showErrorToast(authError);
      expect(toast.warning).toHaveBeenCalledWith("Auth Required", expect.objectContaining({
        duration: 5000
      }));
    });

    it("should include field error description for validation errors", () => {
        const valError = { 
            code: libErrors.ApiErrorCodeConst.BAD_REQUEST,
            hasFieldErrors: true, 
            details: { fieldErrors: { prompt: ["req"], negativePrompt: ["req"] } } 
        } as any;
        vi.mocked(libErrors.isPollinationsApiError).mockReturnValue(true);
        vi.mocked(libErrors.getErrorMessage).mockReturnValueOnce("Validation failed");

        showErrorToast(valError);
        expect(toast.error).toHaveBeenCalledWith("Validation failed", expect.objectContaining({
            description: "2 fields need attention"
        }));
    });
  });

  describe("Simple Toasts", () => {
    it("should show success toast", () => {
      showSuccessToast("Success!");
      expect(toast.success).toHaveBeenCalledWith("Success!", expect.objectContaining({ duration: 3000 }));
    });

    it("should show info toast", () => {
        showInfoToast("Info message");
        expect(toast.info).toHaveBeenCalledWith("Info message", expect.objectContaining({ duration: 4000 }));
    });

    it("should show loading toast", () => {
        showLoadingToast("Loading...");
        expect(toast.loading).toHaveBeenCalledWith("Loading...");
    });
  });

  describe("Toast Updates and Dismissal", () => {
    it("should update toast success", () => {
        updateToastSuccess("id123", "Done!");
        expect(toast.success).toHaveBeenCalledWith("Done!", { id: "id123" });
    });

    it("should update toast error", () => {
        vi.mocked(libErrors.getErrorMessage).mockReturnValueOnce("Failed!");
        updateToastError("id123", new Error("bang"));
        expect(toast.error).toHaveBeenCalledWith("Failed!", { id: "id123" });
    });

    it("should dismiss toast", () => {
        dismissToast("id123");
        expect(toast.dismiss).toHaveBeenCalledWith("id123");
    });
  });

  describe("Specific Helpers", () => {
    it("should show rate limit toast", () => {
        showRateLimitToast(10);
        expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining("10 seconds"), { duration: 10000 });
    });

    it("should show auth required toast with action", () => {
        const onSignIn = vi.fn();
        showAuthRequiredToast(onSignIn);
        expect(toast.warning).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            action: expect.objectContaining({ label: "Sign In" })
        }));
    });
  });

  describe("createToastErrorHandler", () => {
    it("should return a function that shows error toast", () => {
        const handler = createToastErrorHandler({ duration: 1000 });
        handler(new Error("Async Error"));
        expect(toast.error).toHaveBeenCalledWith("Async Error", expect.objectContaining({ duration: 1000 }));
    });
  });
});
