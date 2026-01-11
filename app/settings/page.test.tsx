import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import SettingsPage from "./page"
import React from "react"


// --- Mocks ---

// Mock next-themes
const mockSetTheme = vi.fn()
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: mockSetTheme,
  }),
}))

// Mock Convex
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockUseAction = vi.fn()
const mockUseConvexAuth = vi.fn()

vi.mock("convex/react", () => ({
  useQuery: (args: unknown) => mockUseQuery(args),
  useMutation: (args: unknown) => mockUseMutation(args),
  useAction: (args: unknown) => mockUseAction(args),
  useConvexAuth: () => mockUseConvexAuth(),
}))

// Mock API
vi.mock("@/convex/_generated/api", () => ({
  api: {
    users: {
      getCurrentUser: "users:getCurrentUser",
      updateUsername: "users:updateUsername",
      getPollinationsApiKey: "users:getPollinationsApiKey",
      setPollinationsApiKey: "users:setPollinationsApiKey",
      removePollinationsApiKey: "users:removePollinationsApiKey",
    },
    stripe: {
      createPortalSession: "stripe:createPortalSession",
    },
  },
}))

// Mock Server Actions
const mockEncryptKey = vi.fn()
vi.mock("@/app/settings/actions", () => ({
  encryptKey: (key: string) => mockEncryptKey(key),
}))

// Mock Subscription Hook
vi.mock("@/hooks/use-subscription-status", () => ({
  useSubscriptionStatus: () => ({
    status: "free",
    isLoading: false,
  }),
}))

// Mock Sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock Framer Motion
type MotionDivProps = {
  children: React.ReactNode
  className?: string
}

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className }: MotionDivProps) => <div className={className}>{children}</div>,
    aside: ({ children, className }: MotionDivProps) => <aside className={className}>{children}</aside>
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false })
    mockUseQuery.mockImplementation((query) => {
      if (query === "users:getCurrentUser") {
        return {
          name: "Test User",
          email: "test@example.com",
          username: "testuser",
          pictureUrl: "https://example.com/pic.jpg",
        }
      }
      return null
    })
    mockUseMutation.mockImplementation(() => {
      const fn = vi.fn().mockResolvedValue(undefined)
      return Object.assign(fn, { withOptimisticUpdate: vi.fn().mockReturnValue(fn) })
    })
    mockEncryptKey.mockResolvedValue("encrypted-string")
  })

  it("renders sidebar with navigation items", () => {
    render(<SettingsPage />)
    const sidebar = screen.getByRole("navigation")
    expect(sidebar).toHaveTextContent("Profile")
    expect(sidebar).toHaveTextContent("Appearance")
    expect(sidebar).toHaveTextContent("Subscription")
    expect(sidebar).toHaveTextContent("Pollinations API Key")
  })

  it("defaults to Profile View", () => {
    render(<SettingsPage />)
    // Profile features
    expect(screen.getByLabelText("Username")).toBeInTheDocument()
    // Other tabs should not be visible yet
    expect(screen.queryByText("Theme")).not.toBeInTheDocument()
  })

  it("switches to Appearance view", async () => {
    render(<SettingsPage />)
    
    // Click Appearance
    const appearanceBtn = screen.getByRole("button", { name: /Appearance/i })
    fireEvent.click(appearanceBtn)

    await waitFor(() => {
        expect(screen.getByText("Customize the look and feel of your experience.")).toBeInTheDocument()
        expect(screen.getByText("Dark")).toBeInTheDocument()
    })
  })

  it("switches to Subscription view", async () => {
    render(<SettingsPage />)
    
    // Click Subscription
    const subBtn = screen.getByRole("button", { name: /Subscription/i })
    fireEvent.click(subBtn)

    await waitFor(() => {
        expect(screen.getByText("Manage your plan and billing preferences.")).toBeInTheDocument()
    })
  })

  it("switches to API view and shows Star Repo", async () => {
    render(<SettingsPage />)
    
    const apiBtn = screen.getByRole("button", { name: /Pollinations API Key/i })
    fireEvent.click(apiBtn)

    await waitFor(() => {
        expect(screen.getByLabelText("Pollinations API Key")).toBeInTheDocument()
        // Check for Star Repo card content
        expect(screen.getByText("Boost Your Limits")).toBeInTheDocument()
    })
  })
})
