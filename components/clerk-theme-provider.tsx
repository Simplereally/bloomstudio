"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import type React from "react"

/**
 * ClerkProvider wrapper that dynamically applies theme based on user preference.
 *
 * All colors reference centralized CSS variables from globals.css so that
 * light/dark values are resolved automatically — no JS ternaries needed.
 * Uses modern Clerk variable names (deprecated aliases removed).
 */
export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()

  return (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        variables: {
          colorPrimary: "var(--primary)",
          colorBackground: "var(--background)",
          colorInput: "var(--input)",
          colorForeground: "var(--foreground)",
          colorMutedForeground: "var(--muted-foreground)",
          colorMuted: "var(--muted)",
          colorDanger: "var(--destructive)",
          colorBorder: "var(--border)",
          colorRing: "var(--ring)",
          borderRadius: "var(--radius)",
          fontFamily: "var(--font-geist-sans), Geist, sans-serif",
        },
        elements: {
          card: {
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
          },
          formButtonPrimary: {
            backgroundColor: "var(--primary)",
            "&:hover": {
              filter: "brightness(0.9)",
            },
          },
          footerActionLink: {
            color: "var(--primary)",
          },
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
