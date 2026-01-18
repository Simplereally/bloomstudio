/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileCard } from "./profile-card";
import { useQuery, useMutation } from "convex/react";
import React from "react";

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock API
vi.mock("@/convex/_generated/api", () => ({
  api: {
    users: {
      getCurrentUser: "users:getCurrentUser",
      updateUsername: "users:updateUsername",
    },
  },
}));

// Mock Sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ProfileCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    const mockMutation = Object.assign(vi.fn().mockResolvedValue(undefined), {
        withOptimisticUpdate: vi.fn().mockReturnThis(),
    });
    vi.mocked(useMutation).mockReturnValue(mockMutation);
  });

  it("shows skeleton when user is loading", () => {
    vi.mocked(useQuery).mockReturnValue(undefined);
    render(<ProfileCard />);
    
    // Check for skeleton classes
    const skeletons = screen.getAllByRole("generic").filter(el => el.classList.contains("animate-pulse"));
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders user information correctly", () => {
    const mockUser = {
      name: "Test User",
      email: "test@example.com",
      username: "testuser",
      pictureUrl: "https://example.com/pic.jpg",
    };
    vi.mocked(useQuery).mockReturnValue(mockUser);
    
    render(<ProfileCard />);
    
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
  });

  it("positions the @ symbol at the start of the input", () => {
    const mockUser = {
      name: "Test User",
      email: "test@example.com",
      username: "testuser",
      pictureUrl: "https://example.com/pic.jpg",
    };
    vi.mocked(useQuery).mockReturnValue(mockUser);
    
    render(<ProfileCard />);
    
    const usernameInput = screen.getByLabelText(/Username/i);
    expect(usernameInput).toHaveClass("pl-10");
    
    // Find the @ icon container
    const atSignContainer = usernameInput.parentElement?.querySelector(".absolute.left-3");
    expect(atSignContainer).toBeInTheDocument();
  });

  it("calls updateUsernameMutation when Save Changes is clicked", async () => {
    const mockUser = {
      name: "Test User",
      email: "test@example.com",
      username: "oldusername",
      pictureUrl: "https://example.com/pic.jpg",
    };
    vi.mocked(useQuery).mockReturnValue(mockUser);
    
    const mockMutation = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useMutation).mockReturnValue(Object.assign(mockMutation, {
        withOptimisticUpdate: vi.fn().mockReturnThis(),
    }));

    render(<ProfileCard />);
    
    const input = screen.getByLabelText(/Username/i);
    const saveButton = screen.getByRole("button", { name: /Save Changes/i });

    // Note: We need to change the value. In a real environment, defaultValue is used.
    // For the test, we'll manually change it.
    fireEvent.change(input, { target: { value: "newusername", name: "username" } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockMutation).toHaveBeenCalledWith({ username: "newusername" });
    });
  });
});
