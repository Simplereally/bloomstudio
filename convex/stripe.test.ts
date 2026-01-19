import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  createSubscriptionCheckout, 
  getUserSubscriptions, 
  getUserSubscriptionStatus, 
  createPortalSession 
} from "./stripe";

// Mock Convex server
vi.mock("./_generated/server", () => ({
  action: (config: any) => config,
  query: (config: any) => config,
}));

vi.mock("./_generated/api", () => ({
  components: {
    stripe: {
      public: {
        listSubscriptionsByUserId: "listSubscriptionsByUserId",
      }
    }
  }
}));

// Mock Stripe SDK
vi.mock("stripe", () => {
  return {
    default: vi.fn(function() {
      return {
        checkout: {
          sessions: {
            create: vi.fn().mockResolvedValue({ id: "sess_123", url: "https://stripe.com/checkout/123" }),
          },
        },
      };
    }),
  };
});

// Mock @convex-dev/stripe
vi.mock("@convex-dev/stripe", () => ({
  StripeSubscriptions: vi.fn(function() {
    return {
      getOrCreateCustomer: vi.fn().mockResolvedValue({ customerId: "cus_123" }),
      createCustomerPortalSession: vi.fn().mockResolvedValue({ url: "https://stripe.com/portal/123" }),
    };
  }),
}));

// Mock subscription helper
vi.mock("./lib/subscription", () => ({
  getSubscriptionStatus: vi.fn().mockResolvedValue({ status: "pro" }),
}));

describe("stripe.ts actions and queries", () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      auth: {
        getUserIdentity: vi.fn(),
      },
      runQuery: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe("createSubscriptionCheckout", () => {
    it("should throw if not authenticated", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(null);
      await expect(createSubscriptionCheckout.handler(mockCtx, { priceId: "p_1", isAnnual: false })).rejects.toThrow("Not authenticated");
    });

    it("should create a checkout session for authenticated user", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({ 
        subject: "user_1", 
        email: "test@example.com", 
        name: "Test User" 
      });

      const result = await createSubscriptionCheckout.handler(mockCtx, { 
        priceId: "p_1", 
        isAnnual: true,
        successUrl: "http://success",
        cancelUrl: "http://cancel"
      });

      expect(result).toEqual({
        sessionId: "sess_123",
        url: "https://stripe.com/checkout/123",
      });
    });
  });

  describe("getUserSubscriptions", () => {
    it("should return empty array if not authenticated", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(null);
      const result = await getUserSubscriptions.handler(mockCtx, {});
      expect(result).toEqual([]);
    });

    it("should return user subscriptions if authenticated", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_1" });
      const mockSubs = [{ id: "sub_1" }];
      mockCtx.runQuery.mockResolvedValue(mockSubs);

      const result = await getUserSubscriptions.handler(mockCtx, {});
      
      expect(mockCtx.runQuery).toHaveBeenCalled();
      expect(result).toBe(mockSubs);
    });
  });

  describe("getUserSubscriptionStatus", () => {
    it("should return expired if not authenticated", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(null);
      const result = await getUserSubscriptionStatus.handler(mockCtx, {});
      expect(result).toEqual({ status: "expired" });
    });

    it("should return status from helper if authenticated", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user_1" });
      const result = await getUserSubscriptionStatus.handler(mockCtx, {});
      expect(result).toEqual({ status: "pro" });
    });
  });

  describe("createPortalSession", () => {
    it("should throw if not authenticated", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(null);
      await expect(createPortalSession.handler(mockCtx, {})).rejects.toThrow("Not authenticated");
    });

    it("should return portal session URL", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({ 
        subject: "user_1", 
        email: "test@example.com" 
      });

      const result = await createPortalSession.handler(mockCtx, { returnUrl: "http://return" });
      
      expect(result).toEqual({ url: "https://stripe.com/portal/123" });
    });
  });
});
