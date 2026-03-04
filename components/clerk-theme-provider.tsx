"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import type React from "react"

/**
 * ClerkProvider wrapper that dynamically applies theme based on user preference.
 * Uses our app's CSS variables for consistent branding.
 */
export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()

  return (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        variables: {
          // Match our brand colors from globals.css (cool-neutral Hue 260°)
          colorPrimary: resolvedTheme === "dark" 
            ? "oklch(0.68 0.18 45)"   // Dark mode --primary (orange ember)
            : "oklch(0.58 0.18 45)",  // Light mode --primary
          colorBackground: resolvedTheme === "dark"
            ? "oklch(0.14 0.005 260)" // Dark mode --background
            : "oklch(0.98 0.002 260)", // Light mode --background
          colorInputBackground: resolvedTheme === "dark"
            ? "oklch(0.23 0.005 260)" // Dark mode --input
            : "oklch(0.91 0.004 260)", // Light mode --input
          colorText: resolvedTheme === "dark"
            ? "oklch(0.97 0.005 50)"  // Dark mode --foreground
            : "oklch(0.15 0.01 260)", // Light mode --foreground
          colorTextSecondary: resolvedTheme === "dark"
            ? "oklch(0.7 0.01 50)"    // Dark mode --muted-foreground
            : "oklch(0.40 0.01 260)", // Light mode --muted-foreground
          colorDanger: resolvedTheme === "dark"
            ? "oklch(0.55 0.22 15)"   // Dark mode --destructive
            : "oklch(0.50 0.22 20)",  // Light mode --destructive
          borderRadius: "0.75rem",    // Matches our --radius
          fontFamily: "var(--font-geist-sans), Geist, sans-serif",
        },
        elements: {
          // Additional element-level styling for consistency
          card: {
            backgroundColor: resolvedTheme === "dark"
              ? "oklch(0.18 0.005 260)" // Dark mode --card
              : "oklch(1 0 0)",          // Light mode --card
            borderColor: resolvedTheme === "dark"
              ? "oklch(0.26 0.006 260)" // Dark mode --border
              : "oklch(0.90 0.004 260)", // Light mode --border
          },
          formButtonPrimary: {
            backgroundColor: resolvedTheme === "dark"
              ? "oklch(0.68 0.18 45)"
              : "oklch(0.58 0.18 45)",
            "&:hover": {
              backgroundColor: resolvedTheme === "dark"
                ? "oklch(0.62 0.18 45)"  // Slightly darker primary for hover
                : "oklch(0.52 0.18 45)", // Slightly darker primary for hover
            },
          },
          footerActionLink: {
            color: resolvedTheme === "dark"
              ? "oklch(0.68 0.18 45)"
              : "oklch(0.58 0.18 45)",
          },
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
