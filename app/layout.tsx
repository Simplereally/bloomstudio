import { ClerkThemeProvider } from "@/components/clerk-theme-provider"
import { Header } from "@/components/layout/header"
import { ConvexClientProvider, QueryProvider } from "@/components/providers"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google"
import type React from "react"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

export const metadata: Metadata = {
  title: {
    default: "Bloom Studio - Powerful AI Image Generation",
    template: "%s | Bloom Studio",
  },
  description:
    "Create stunning AI-generated images with Bloom Studio. Configure models, dimensions, and advanced parameters for free. Experience the next generation of creative tools.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://bloomstudio.fun"),
  applicationName: "Bloom Studio",
  authors: [{ name: "Bloom Studio Team" }],
  generator: "Next.js",
  keywords: [
    "AI",
    "Image Generation",
    "Stable Diffusion",
    "Flux",
    "Art",
    "Creative",
    "Kling",
    "Image Gen",
    "Chatgpt",
    "Bloom Studio",
    "Midjourney",
  ],
  referrer: "origin-when-cross-origin",
  creator: "Bloom Studio",
  publisher: "Bloom Studio",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Bloom Studio - Powerful AI Image Generation",
    description:
      "Create stunning AI-generated images with Bloom Studio. Configure models, dimensions, and advanced parameters for free.",
    siteName: "Bloom Studio",
    images: [
      {
        url: "/branding/bloom-studio_logo.png",
        width: 1200,
        height: 630,
        alt: "Bloom Studio Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bloom Studio - Powerful AI Image Generation",
    description:
      "Create stunning AI-generated images with Bloom Studio. Configure models, dimensions, and advanced parameters for free.",
    images: ["/branding/bloom-studio_logo.png"],
    creator: "@bloomstudio",
  },
  appleWebApp: {
    capable: true,
    title: "Bloom Studio",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
}

/**
 * Root application layout that wraps pages with global providers, theming, fonts, and shared UI.
 *
 * Wraps `children` with HTML/body and a hierarchy of providers (theme, auth, data, query), renders the site header, toast container, performance insights, and analytics.
 *
 * @param children - The page content to render inside the layout
 * @returns The root HTML element containing global providers and the rendered page content
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} ${bricolage.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkThemeProvider>
            <ConvexClientProvider>
              <QueryProvider>
                <Header />
                {children}
                <Toaster position="bottom-right" richColors closeButton />
                <SpeedInsights />
              </QueryProvider>
            </ConvexClientProvider>
          </ClerkThemeProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
