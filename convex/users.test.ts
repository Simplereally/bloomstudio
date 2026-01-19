import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  getOrCreateUser, 
  getCurrentUser, 
  setPollinationsApiKey, 
  getPollinationsApiKey,
  removePollinationsApiKey,
  getEncryptedApiKeyByClerkId,
  updateUsername,
  getUserProfile,
  updateSensitiveContentPreference,
  getSensitiveContentPreference
} from "./users";

// Mock Convex server
vi.mock("./_generated/server", () => ({
  mutation: (config: any) => config,
  query: (config: any) => config,
  internalQuery: (config: any) => config,
}));

vi.mock("./usernameGenerator", () => ({
  generateRandomUsername: vi.fn(() => "RandomUser123"),
}));

vi.mock("./lib/crypto", () => ({
  encryptApiKey: vi.fn(async (key) => `encrypted_${key}`),
  decryptApiKey: vi.fn(async (key) => key.replace("encrypted_", "")),
}));

describe("users.ts mutations and queries", () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      auth: {
        getUserIdentity: vi.fn(),
      },
      db: {
        query: vi.fn(),
        insert: vi.fn(),
        patch: vi.fn(),
      },
    };
  });

  describe("getOrCreateUser", () => {
    it("should throw if not authenticated", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(null);
      await expect(getOrCreateUser.handler(mockCtx, {})).rejects.toThrow("Not authenticated");
    });

    it("should create a new user if they don't exist", async () => {
      const identity = { subject: "clerk_123", email: "test@example.com", name: "Test User", pictureUrl: "http://example.com/pic.jpg" };
      mockCtx.auth.getUserIdentity.mockResolvedValue(identity);
      
      const mockQuery = {
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue(null),
      };
      mockCtx.db.query.mockReturnValue(mockQuery);
      mockCtx.db.insert.mockResolvedValue("user_id_1");

      const result = await getOrCreateUser.handler(mockCtx, {});

      expect(result).toBe("user_id_1");
      expect(mockCtx.db.insert).toHaveBeenCalledWith("users", expect.objectContaining({
        clerkId: "clerk_123",
        email: "test@example.com",
        username: "RandomUser123",
        contentFilterPreference: "blur",
      }));
    });

    it("should update an existing user if their info changed", async () => {
      const identity = { subject: "clerk_123", email: "new@example.com", name: "New Name", pictureUrl: "http://example.com/new.jpg" };
      mockCtx.auth.getUserIdentity.mockResolvedValue(identity);
      
      const existingUser = {
        _id: "user_id_1",
        clerkId: "clerk_123",
        email: "old@example.com",
        name: "Old Name",
        pictureUrl: "http://example.com/old.jpg",
      };
      
      const mockQuery = {
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue(existingUser),
      };
      mockCtx.db.query.mockReturnValue(mockQuery);

      const result = await getOrCreateUser.handler(mockCtx, {});

      expect(result).toBe("user_id_1");
      expect(mockCtx.db.patch).toHaveBeenCalledWith("user_id_1", expect.objectContaining({
        email: "new@example.com",
        name: "New Name",
        pictureUrl: "http://example.com/new.jpg",
      }));
    });

    it("should not update an existing user if info is the same", async () => {
        const identity = { subject: "clerk_123", email: "same@example.com", name: "Same Name", pictureUrl: "http://example.com/same.jpg" };
        mockCtx.auth.getUserIdentity.mockResolvedValue(identity);
        
        const existingUser = {
          _id: "user_id_1",
          clerkId: "clerk_123",
          email: "same@example.com",
          name: "Same Name",
          pictureUrl: "http://example.com/same.jpg",
        };
        
        const mockQuery = {
          withIndex: vi.fn().mockReturnThis(),
          unique: vi.fn().mockResolvedValue(existingUser),
        };
        mockCtx.db.query.mockReturnValue(mockQuery);
  
        await getOrCreateUser.handler(mockCtx, {});
  
        expect(mockCtx.db.patch).not.toHaveBeenCalled();
      });
  });

  describe("getCurrentUser", () => {
    it("should return null if not authenticated", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(null);
      const result = await getCurrentUser.handler(mockCtx, {});
      expect(result).toBeNull();
    });

    it("should return the user record if authenticated", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "clerk_123" });
      const mockQuery = {
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue({ _id: "user_1", username: "testuser" }),
      };
      mockCtx.db.query.mockReturnValue(mockQuery);

      const result = await getCurrentUser.handler(mockCtx, {});
      expect(result).toEqual({ _id: "user_1", username: "testuser" });
    });
  });

  describe("setPollinationsApiKey", () => {
    it("should encrypt and save the API key", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "clerk_123" });
      const mockUser = { _id: "user_1" };
      const mockQuery = {
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue(mockUser),
      };
      mockCtx.db.query.mockReturnValue(mockQuery);

      const result = await setPollinationsApiKey.handler(mockCtx, { apiKey: "test-key" });

      expect(result).toEqual({ success: true });
      expect(mockCtx.db.patch).toHaveBeenCalledWith("user_1", expect.objectContaining({
        pollinationsApiKey: "encrypted_test-key",
      }));
    });

    it("should throw if user not found", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "clerk_123" });
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue(null),
      });

      await expect(setPollinationsApiKey.handler(mockCtx, { apiKey: "test-key" })).rejects.toThrow("User not found");
    });
  });

  describe("getPollinationsApiKey", () => {
    it("should return decrypted key if set", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "clerk_123" });
      const mockUser = { _id: "user_1", pollinationsApiKey: "encrypted_test-key" };
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue(mockUser),
      });

      const result = await getPollinationsApiKey.handler(mockCtx, {});
      expect(result).toBe("test-key");
    });

    it("should return null if no key set", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "clerk_123" });
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue({ _id: "user_1" }),
      });

      const result = await getPollinationsApiKey.handler(mockCtx, {});
      expect(result).toBeNull();
    });
  });

  describe("getEncryptedApiKeyByClerkId", () => {
    it("should return the encrypted key by clerkId", async () => {
      const mockUser = { _id: "user_1", pollinationsApiKey: "encrypted_secret" };
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue(mockUser),
      });

      const result = await getEncryptedApiKeyByClerkId.handler(mockCtx, { clerkId: "clerk_1" });
      expect(result).toBe("encrypted_secret");
    });

    it("should return null if user not found", async () => {
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue(null),
      });

      const result = await getEncryptedApiKeyByClerkId.handler(mockCtx, { clerkId: "nonexistent" });
      expect(result).toBeNull();
    });
  });

  describe("removePollinationsApiKey", () => {
    it("should clear the API key", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "clerk_123" });
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue({ _id: "user_1" }),
      });

      const result = await removePollinationsApiKey.handler(mockCtx, {});
      expect(result).toEqual({ success: true });
      expect(mockCtx.db.patch).toHaveBeenCalledWith("user_1", expect.objectContaining({
        pollinationsApiKey: undefined,
      }));
    });
  });

  describe("updateUsername", () => {
    it("should update valid username", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "clerk_123" });
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue({ _id: "user_1" }),
      });

      const result = await updateUsername.handler(mockCtx, { username: "valid_user_123" });
      expect(result).toEqual({ success: true });
      expect(mockCtx.db.patch).toHaveBeenCalledWith("user_1", expect.objectContaining({
        username: "valid_user_123",
      }));
    });

    it("should throw for invalid usernames", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "clerk_123" });
      
      await expect(updateUsername.handler(mockCtx, { username: "ab" })).rejects.toThrow("at least 3 characters");
      await expect(updateUsername.handler(mockCtx, { username: "a".repeat(31) })).rejects.toThrow("30 characters or less");
      await expect(updateUsername.handler(mockCtx, { username: "invalid space" })).rejects.toThrow("can only contain letters");
    });
  });

  describe("getUserProfile", () => {
    it("should return profile if user exists", async () => {
      const mockUser = {
        _id: "user_1",
        clerkId: "clerk_1",
        username: "testuser",
        pictureUrl: "pic",
        followersCount: 10,
        followingCount: 5,
        imagesCount: 20,
        createdAt: 12345,
      };
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue(mockUser),
      });

      const result = await getUserProfile.handler(mockCtx, { username: "testuser" });
      expect(result).toEqual({
        _id: "user_1",
        clerkId: "clerk_1",
        username: "testuser",
        pictureUrl: "pic",
        followersCount: 10,
        followingCount: 5,
        imagesCount: 20,
        createdAt: 12345,
      });
    });

    it("should return null if user not found", async () => {
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue(null),
      });

      const result = await getUserProfile.handler(mockCtx, { username: "nonexistent" });
      expect(result).toBeNull();
    });
  });

  describe("sensitive content preferences", () => {
    it("should update preference", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "clerk_123" });
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue({ _id: "user_1" }),
      });

      await updateSensitiveContentPreference.handler(mockCtx, { showSensitiveContent: "allow" });
      expect(mockCtx.db.patch).toHaveBeenCalledWith("user_1", expect.objectContaining({
        contentFilterPreference: "allow",
      }));
    });

    it("should get preference", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "clerk_123" });
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnThis(),
        unique: vi.fn().mockResolvedValue({ _id: "user_1", contentFilterPreference: "block" }),
      });

      const result = await getSensitiveContentPreference.handler(mockCtx, {});
      expect(result).toBe("block");
    });

    it("should return default preference if not authenticated", async () => {
        mockCtx.auth.getUserIdentity.mockResolvedValue(null);
        const result = await getSensitiveContentPreference.handler(mockCtx, {});
        expect(result).toBe("blur");
    });
  });
});
