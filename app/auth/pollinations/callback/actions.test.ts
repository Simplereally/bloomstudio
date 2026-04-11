import { beforeEach, describe, expect, it, vi } from "vitest";
import { savePollinationsApiKey } from "./actions";
import { fetchMutation } from "convex/nextjs";
import { getConvexClerkToken } from "@/app/_server/convex/client";
import { api } from "@/convex/_generated/api";

vi.mock("convex/nextjs", () => ({
  fetchMutation: vi.fn(),
}));

vi.mock("@/app/_server/convex/client", () => ({
  getConvexClerkToken: vi.fn(),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    users: {
      setPollinationsApiKey: "users:setPollinationsApiKey",
    },
  },
}));

describe("savePollinationsApiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConvexClerkToken).mockResolvedValue("convex-token");
    vi.mocked(fetchMutation).mockResolvedValue({ success: true });
  });

  it("stores a valid API key with the Clerk Convex token", async () => {
    const result = await savePollinationsApiKey("sk_test1234");

    expect(result).toEqual({ status: "success" });
    expect(fetchMutation).toHaveBeenCalledWith(
      api.users.setPollinationsApiKey,
      { apiKey: "sk_test1234" },
      { token: "convex-token" },
    );
  });

  it("rejects a missing API key before calling Convex", async () => {
    const result = await savePollinationsApiKey(null);

    expect(result).toEqual({ status: "error_missing_key" });
    expect(fetchMutation).not.toHaveBeenCalled();
  });

  it("rejects an invalid API key before calling Convex", async () => {
    const result = await savePollinationsApiKey("invalid");

    expect(result).toEqual({ status: "error_invalid_key" });
    expect(fetchMutation).not.toHaveBeenCalled();
  });

  it("returns save failure when no auth token is available", async () => {
    vi.mocked(getConvexClerkToken).mockResolvedValue(undefined);

    const result = await savePollinationsApiKey("sk_test1234");

    expect(result).toEqual({ status: "error_save_failed" });
    expect(fetchMutation).not.toHaveBeenCalled();
  });
});
