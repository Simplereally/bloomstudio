// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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
      getSensitiveContentPreference: "users:getSensitiveContentPreference",
      updateSensitiveContentPreference: "users:updateSensitiveContentPreference",
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

// Mock API Card Hook
vi.mock("@/hooks/use-api-card-state", () => ({
    useApiCardState: () => ({
        legacyState: { hasLegacyKey: false },
        byopState: { isConnected: false, isExpiringSoon: false, isExpired: false, daysUntilExpiry: null, isLoading: false },
        connectionStatus: "not-connected",
        actionState: { isRedirecting: false, isRemoving: false, showLegacySection: false, setShowLegacySection: vi.fn() },
        handlers: { handleReconnect: vi.fn(), handleDisconnect: vi.fn(), handleRemoveLegacyKey: vi.fn() }
    })
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

// Mock Pollen Auth - provides default unauthenticated state
vi.mock("@/lib/pollen-auth", () => ({
  usePollenAuth: () => ({
    isAuthorized: false,
    isExpired: false,
    isExpiringSoon: false,
    daysUntilExpiry: null,
    apiKey: null,
    authorizedAt: null,
    expiresAt: null,
    authorize: vi.fn(),
    disconnect: vi.fn(),
  }),
  PollenAuthProvider: ({ children }: { children: React.ReactNode }) => children,
  PollenAuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
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
      if (query === "users:getSensitiveContentPreference") {
        return "blur"
      }
      return null
    })
    mockUseMutation.mockImplementation(() => {
      const fn = vi.fn().mockResolvedValue(undefined)
      return Object.assign(fn, { withOptimisticUpdate: vi.fn().mockReturnValue(fn) })
    })
    mockEncryptKey.mockResolvedValue("encrypted-string")
  })

  it("renders tabs with correct labels", () => {
    render(<SettingsPage />)
    const tabsList = screen.getByRole("tablist")
    expect(tabsList).toHaveTextContent("Profile")
    expect(tabsList).toHaveTextContent("Appearance")
    expect(tabsList).toHaveTextContent("Privacy & Safety")
    expect(tabsList).toHaveTextContent("Subscription")
    expect(tabsList).toHaveTextContent("Pollinations API Key")
  })

  it("defaults to Profile View", async () => {
    render(<SettingsPage />)
    await waitFor(() => {
        expect(screen.getByText("Profile Settings")).toBeInTheDocument()
        expect(screen.getByLabelText(/Username/i)).toBeInTheDocument()
    })
  })

  it("switches to Privacy view via tab", async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)
    const privacyBtn = screen.getByRole("tab", { name: /Privacy & Safety/i })
    await user.click(privacyBtn)
    await waitFor(() => {
        expect(screen.getByText("Content Visibility")).toBeInTheDocument()
    })
  })

  it("switches to Appearance view", async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    const appearanceTab = screen.getByRole("tab", { name: /Appearance/i })
    await user.click(appearanceTab)

    await waitFor(() => {
      expect(screen.getByText("Customize the look and feel of your experience.")).toBeInTheDocument()
      expect(screen.getByText("Dark")).toBeInTheDocument()
    })
  })

  it("switches to Subscription view", async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    const subTab = screen.getByRole("tab", { name: /Subscription/i })
    await user.click(subTab)

    await waitFor(() => {
      expect(screen.getByText("Subscription Plan")).toBeInTheDocument()
      expect(screen.getByText("Plan Benefits")).toBeInTheDocument()
    })
  })

  it("switches to API view and shows Star Repo", async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    const apiBtn = screen.getByRole("tab", { name: /Pollinations API Key/i })
    await user.click(apiBtn)

    await waitFor(() => {
      expect(screen.getByText("Pollinations Connection")).toBeInTheDocument()
      // Check for Star Repo card content
      expect(screen.getByText("Boost Your Limits")).toBeInTheDocument()
    })
  })
})
