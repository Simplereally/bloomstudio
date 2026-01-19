import { describe, it, expect } from "vitest";
import {
  ServerGenerateRequestSchema,
  ServerGenerateSuccessSchema,
  ServerGenerateErrorSchema,
  ServerGenerateResponseSchema,
} from "./server-generate.schema";

describe("ServerGenerateRequestSchema", () => {
  it("should validate a valid request", () => {
    const validRequest = {
      prompt: "test prompt",
      width: 1024,
      height: 768,
      model: "turbo",
    };
    const result = ServerGenerateRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it("should fail if prompt is missing", () => {
    const invalidRequest = {
      width: 1024,
      height: 768,
    };
    const result = ServerGenerateRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });
});

describe("ServerGenerateSuccessSchema", () => {
  it("should validate a valid success response", () => {
    const validSuccess = {
      success: true,
      data: {
        id: "img_123",
        url: "https://example.com/image.jpg",
        prompt: "test prompt",
        timestamp: 1234567890,
        params: {
          prompt: "test prompt",
          width: 512,
          height: 512,
        },
      },
    };
    const result = ServerGenerateSuccessSchema.safeParse(validSuccess);
    expect(result.success).toBe(true);
  });

  it("should fail if success is false", () => {
    const invalidSuccess = {
      success: false,
      data: {},
    };
    const result = ServerGenerateSuccessSchema.safeParse(invalidSuccess);
    expect(result.success).toBe(false);
  });
});

describe("ServerGenerateErrorSchema", () => {
  it("should validate a valid error response", () => {
    const validError = {
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Invalid input",
        details: { field: "width", issue: "too small" },
      },
    };
    const result = ServerGenerateErrorSchema.safeParse(validError);
    expect(result.success).toBe(true);
  });

  it("should fail if success is true", () => {
    const invalidError = {
      success: true,
      error: {},
    };
    const result = ServerGenerateErrorSchema.safeParse(invalidError);
    expect(result.success).toBe(false);
  });
});

describe("ServerGenerateResponseSchema", () => {
  it("should validate a success response", () => {
    const validSuccess = {
      success: true,
      data: {
        id: "img_123",
        url: "https://example.com/image.jpg",
        prompt: "test prompt",
        timestamp: 1234567890,
        params: {
          prompt: "test prompt",
        },
      },
    };
    const result = ServerGenerateResponseSchema.safeParse(validSuccess);
    expect(result.success).toBe(true);
  });

  it("should validate an error response", () => {
    const validError = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong",
      },
    };
    const result = ServerGenerateResponseSchema.safeParse(validError);
    expect(result.success).toBe(true);
  });
});
