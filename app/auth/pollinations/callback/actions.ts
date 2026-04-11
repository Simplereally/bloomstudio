"use server";

import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getConvexClerkToken } from "@/app/_server/convex/client";
import { isValidApiKeyFormat } from "@/lib/pollen-auth/storage";

export type SavePollinationsApiKeyResult = {
  status:
    | "idle"
    | "success"
    | "error_missing_key"
    | "error_invalid_key"
    | "error_save_failed";
};

/**
 * Stores the Pollinations API key from the OAuth callback via an authenticated
 * server boundary. The browser still has to read the URL hash because fragments
 * are not sent to the server.
 */
export async function savePollinationsApiKey(
  apiKey: string | null,
): Promise<SavePollinationsApiKeyResult> {
  if (!apiKey) {
    return { status: "error_missing_key" };
  }

  if (!isValidApiKeyFormat(apiKey)) {
    return { status: "error_invalid_key" };
  }

  try {
    const token = await getConvexClerkToken();

    if (!token) {
      return { status: "error_save_failed" };
    }

    await fetchMutation(
      api.users.setPollinationsApiKey,
      { apiKey },
      { token },
    );

    return { status: "success" };
  } catch (error) {
    console.error("[PollinationsCallback] Error saving API key:", error);
    return { status: "error_save_failed" };
  }
}
