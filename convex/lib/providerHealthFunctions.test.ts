// Mock standard Convex server functions to expose handler
vi.mock("../_generated/server", () => ({
  internalQuery: (args: any) => args,
  internalMutation: (args: any) => args,
  query: (args: any) => args,
  mutation: (args: any) => args,
}));

import {
  checkProvidersAvailable,
  getHealth,
  recordRateLimit,
  recordRateLimitWithReset,
  markAvailable,
  refreshExpiredLimits,
  resetAllProviders
} from "./providerHealthFunctions";
import * as providerHealth from "./providerHealth";

vi.mock("./providerHealth", () => ({
  getProviderHealth: vi.fn(),
  hasAvailableProvider: vi.fn(),
  markProviderRateLimited: vi.fn(),
  markProviderAvailable: vi.fn(),
  parseGroqRateLimitError: vi.fn(),
  parseOpenRouterRateLimitError: vi.fn(),
}));

describe("providerHealthFunctions", () => {
  let mockCtx: any;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      query: vi.fn().mockReturnThis(),
      withIndex: vi.fn().mockReturnThis(),
      first: vi.fn(),
      eq: vi.fn().mockReturnThis(),
    };
    mockCtx = {
      db: mockDb,
    };
  });

  describe("checkProvidersAvailable", () => {
    it("should call hasAvailableProvider", async () => {
      (providerHealth.hasAvailableProvider as any).mockResolvedValue(true);
      const result = await (checkProvidersAvailable as any).handler(mockCtx, {});
      expect(providerHealth.hasAvailableProvider).toHaveBeenCalledWith(mockCtx);
      expect(result).toBe(true);
    });
  });

  describe("getHealth", () => {
    it("should call getProviderHealth", async () => {
      const mockHealth = { isAvailable: true };
      (providerHealth.getProviderHealth as any).mockResolvedValue(mockHealth);
      const result = await (getHealth as any).handler(mockCtx, { provider: "groq" });
      expect(providerHealth.getProviderHealth).toHaveBeenCalledWith(mockCtx, "groq");
      expect(result).toBe(mockHealth);
    });
  });

  describe("recordRateLimit", () => {
    it("should parse Groq error and mark rate limited", async () => {
      const errorBody = "error details";
      const mockParsed = { resetAt: 12345 };
      (providerHealth.parseGroqRateLimitError as any).mockReturnValue(mockParsed);

      await (recordRateLimit as any).handler(mockCtx, { provider: "groq", errorBody });

      expect(providerHealth.parseGroqRateLimitError).toHaveBeenCalledWith(errorBody);
      expect(providerHealth.markProviderRateLimited).toHaveBeenCalledWith(mockCtx, "groq", mockParsed);
    });

    it("should parse OpenRouter error and mark rate limited", async () => {
      const errorBody = "error details";
      const mockParsed = { resetAt: 67890 };
      (providerHealth.parseOpenRouterRateLimitError as any).mockReturnValue(mockParsed);

      await (recordRateLimit as any).handler(mockCtx, { provider: "openrouter", errorBody });

      expect(providerHealth.parseOpenRouterRateLimitError).toHaveBeenCalledWith(errorBody);
      expect(providerHealth.markProviderRateLimited).toHaveBeenCalledWith(mockCtx, "openrouter", mockParsed);
    });
  });

  describe("recordRateLimitWithReset", () => {
    it("should call markProviderRateLimited with provided args", async () => {
      const args = {
        provider: "groq" as const,
        resetAt: 1000,
        remaining: 5,
        limit: 10,
        errorMessage: "fail",
      };

      await (recordRateLimitWithReset as any).handler(mockCtx, args);

      expect(providerHealth.markProviderRateLimited).toHaveBeenCalledWith(mockCtx, "groq", {
        resetAt: 1000,
        remaining: 5,
        limit: 10,
        errorMessage: "fail",
      });
    });
  });

  describe("markAvailable", () => {
    it("should call markProviderAvailable", async () => {
      await (markAvailable as any).handler(mockCtx, { provider: "groq" });
      expect(providerHealth.markProviderAvailable).toHaveBeenCalledWith(mockCtx, "groq");
    });
  });

  describe("refreshExpiredLimits", () => {
    it("should reset expired providers", async () => {
        const now = Date.now();
        const expiredTime = now - 1000;
        
        // Mock DB query sequence for groq then openrouter
        mockDb.first
            .mockResolvedValueOnce({ isAvailable: false, rateLimitedUntil: expiredTime }) // groq expired
            .mockResolvedValueOnce({ isAvailable: true }); // openrouter ok

        await (refreshExpiredLimits as any).handler(mockCtx, {});

        // Should check both
        expect(mockCtx.db.query).toHaveBeenCalledWith("providerHealth");
        expect(mockCtx.db.query).toHaveBeenCalledTimes(2);

        // Should only mark groq available
        expect(providerHealth.markProviderAvailable).toHaveBeenCalledWith(mockCtx, "groq");
        expect(providerHealth.markProviderAvailable).not.toHaveBeenCalledWith(mockCtx, "openrouter");
    });

    it("should not reset active rate limits", async () => {
        const now = Date.now();
        const futureTime = now + 10000;
        
        mockDb.first
            .mockResolvedValueOnce({ isAvailable: false, rateLimitedUntil: futureTime })
            .mockResolvedValueOnce({ isAvailable: false, rateLimitedUntil: futureTime });

        await (refreshExpiredLimits as any).handler(mockCtx, {});

        expect(providerHealth.markProviderAvailable).not.toHaveBeenCalled();
    });
  });

  describe("resetAllProviders", () => {
    it("should reset both providers", async () => {
      await (resetAllProviders as any).handler(mockCtx, {});
      expect(providerHealth.markProviderAvailable).toHaveBeenCalledWith(mockCtx, "groq");
      expect(providerHealth.markProviderAvailable).toHaveBeenCalledWith(mockCtx, "openrouter");
    });
  });
});
