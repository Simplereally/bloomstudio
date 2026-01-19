import { describe, it, expect } from "vitest";
import * as Errors from "./index";

describe("lib/errors/index", () => {
  it("should export PollinationsApiError", () => {
    expect(Errors.PollinationsApiError).toBeDefined();
  });

  it("should export error checking utilities", () => {
    expect(Errors.isPollinationsApiError).toBeDefined();
    expect(Errors.isApiError).toBeDefined();
    expect(Errors.getErrorMessage).toBeDefined();
  });

  it("should export toast utilities", () => {
    expect(Errors.showErrorToast).toBeDefined();
    expect(Errors.showSuccessToast).toBeDefined();
    expect(Errors.createToastErrorHandler).toBeDefined();
  });

  it("should export constants", () => {
    expect(Errors.ERROR_MESSAGES).toBeDefined();
    expect(Errors.ApiErrorCodeConst).toBeDefined();
    expect(Errors.ClientErrorCode).toBeDefined();
  });
});
