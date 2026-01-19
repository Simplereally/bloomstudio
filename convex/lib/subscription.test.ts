import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the generated api and server types/functions
vi.mock("../_generated/api", () => ({
  components: {
    stripe: {
      public: {
        listSubscriptionsByUserId: "listSubscriptionsByUserId",
      },
    },
  },
}));

import { hasActiveSubscription, isInTrialPeriod, canUserGenerate, getSubscriptionStatus } from "./subscription";

describe("subscription library", () => {
  let mockCtx: any;
  const userId = "user_123";
  const now = 1000000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    
    mockCtx = {
      runQuery: vi.fn(),
      db: {
        query: vi.fn(),
      },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("hasActiveSubscription", () => {
    it("should return true if user has an active subscription", async () => {
      mockCtx.runQuery.mockResolvedValue([{ status: "active" }]);
      
      const result = await hasActiveSubscription(mockCtx, userId);
      
      expect(result).toBe(true);
      expect(mockCtx.runQuery).toHaveBeenCalledWith("listSubscriptionsByUserId", { userId });
    });

    it("should return false if user has no active subscriptions", async () => {
      mockCtx.runQuery.mockResolvedValue([{ status: "canceled" }, { status: "past_due" }]);
      
      const result = await hasActiveSubscription(mockCtx, userId);
      
      expect(result).toBe(false);
    });

    it("should return false if user has no subscriptions at all", async () => {
      mockCtx.runQuery.mockResolvedValue([]);
      
      const result = await hasActiveSubscription(mockCtx, userId);
      
      expect(result).toBe(false);
    });
  });

  describe("isInTrialPeriod", () => {
    const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000;

    it("should return true if user was created within 24 hours", async () => {
      const user = { createdAt: now - TRIAL_DURATION_MS + 1000 };
      const mockQuery = {
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue(user),
      };
      mockCtx.db.query.mockReturnValue(mockQuery);

      const result = await isInTrialPeriod(mockCtx, userId);
      
      expect(result).toBe(true);
    });

    it("should return false if user was created more than 24 hours ago", async () => {
      const user = { createdAt: now - TRIAL_DURATION_MS - 1000 };
      const mockQuery = {
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue(user),
      };
      mockCtx.db.query.mockReturnValue(mockQuery);

      const result = await isInTrialPeriod(mockCtx, userId);
      
      expect(result).toBe(false);
    });

    it("should return false if user doesn't exist", async () => {
      const mockQuery = {
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue(null),
      };
      mockCtx.db.query.mockReturnValue(mockQuery);

      const result = await isInTrialPeriod(mockCtx, userId);
      
      expect(result).toBe(false);
    });
  });

  describe("canUserGenerate", () => {
    it("should allow if user has active subscription", async () => {
      // Mock hasActiveSubscription to return true
      mockCtx.runQuery.mockResolvedValue([{ status: "active" }]);
      
      const result = await canUserGenerate(mockCtx, userId);
      
      expect(result).toEqual({ allowed: true });
    });

    it("should allow if user is in trial period", async () => {
      // Mock hasActiveSubscription to return false
      mockCtx.runQuery.mockResolvedValue([]);
      // Mock isInTrialPeriod to return true
      const user = { createdAt: now - 1000 };
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue(user),
      });

      const result = await canUserGenerate(mockCtx, userId);
      
      expect(result).toEqual({ allowed: true });
    });

    it("should deny if subscription is inactive and trial expired", async () => {
      // Mock hasActiveSubscription to return false
      mockCtx.runQuery.mockResolvedValue([]);
      // Mock isInTrialPeriod to return false
      const user = { createdAt: now - (25 * 60 * 60 * 1000) };
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue(user),
      });

      const result = await canUserGenerate(mockCtx, userId);
      
      expect(result.allowed).toBe(false);
      expect(result).toHaveProperty("reason");
    });
  });

  describe("getSubscriptionStatus", () => {
    it("should return pro status if user has subscription", async () => {
      mockCtx.runQuery.mockResolvedValue([{ status: "active" }]);
      
      const result = await getSubscriptionStatus(mockCtx, userId);
      
      expect(result).toEqual({ status: "pro" });
    });

    it("should return trial status if no subscription but in trial", async () => {
      mockCtx.runQuery.mockResolvedValue([]);
      const createdAt = now - 1000;
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue({ createdAt }),
      });

      const result = await getSubscriptionStatus(mockCtx, userId);
      
      expect(result).toEqual({ 
        status: "trial", 
        trialExpiresAt: createdAt + (24 * 60 * 60 * 1000) 
      });
    });

    it("should return expired status if trial ended", async () => {
      mockCtx.runQuery.mockResolvedValue([]);
      const createdAt = now - (25 * 60 * 60 * 1000);
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue({ createdAt }),
      });

      const result = await getSubscriptionStatus(mockCtx, userId);
      
      expect(result).toEqual({ 
        status: "expired", 
        trialExpiresAt: createdAt + (24 * 60 * 60 * 1000) 
      });
    });

    it("should return expired status if user not found", async () => {
      mockCtx.runQuery.mockResolvedValue([]);
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue(null),
      });

      const result = await getSubscriptionStatus(mockCtx, userId);
      
      expect(result).toEqual({ status: "expired" });
    });
  });
});
