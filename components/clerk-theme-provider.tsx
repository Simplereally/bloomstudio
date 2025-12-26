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
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        variables: {
          // Match our brand colors from globals.css
          colorPrimary: resolvedTheme === "dark" 
            ? "oklch(0.68 0.18 45)"   // Dark mode --primary (orange ember)
            : "oklch(0.58 0.18 45)",  // Light mode --primary
          colorBackground: resolvedTheme === "dark"
            ? "oklch(0.14 0.015 30)"  // Dark mode --background
            : "oklch(0.98 0.005 60)", // Light mode --background
          colorInputBackground: resolvedTheme === "dark"
            ? "oklch(0.29 0.02 35)"   // Dark mode --input
            : "oklch(0.92 0.008 50)", // Light mode --input
          colorText: resolvedTheme === "dark"
            ? "oklch(0.97 0.005 50)"  // Dark mode --foreground
            : "oklch(0.18 0.015 30)", // Light mode --foreground
          colorTextSecondary: resolvedTheme === "dark"
            ? "oklch(0.58 0.01 40)"   // Dark mode --muted-foreground
            : "oklch(0.45 0.015 40)", // Light mode --muted-foreground
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
              ? "oklch(0.19 0.018 35)"  // Dark mode --card
              : "oklch(0.99 0.003 60)", // Light mode --card
            borderColor: resolvedTheme === "dark"
              ? "oklch(0.32 0.02 38)"   // Dark mode --border
              : "oklch(0.88 0.01 50)",  // Light mode --border
          },
          formButtonPrimary: {
            backgroundColor: resolvedTheme === "dark"
              ? "oklch(0.68 0.18 45)"
              : "oklch(0.58 0.18 45)",
            "&:hover": {
              backgroundColor: resolvedTheme === "dark"
                ? "oklch(0.62 0.22 35)"  // Dark mode --accent
                : "oklch(0.55 0.20 40)", // Light mode --accent
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
