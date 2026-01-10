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
import { JsonLd } from "@/components/seo/json-ld"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" })

/**
 * Viewport configuration for the application.
 * Controls scaling, theme colors, and layout behavior on different devices.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

/**
 * Global metadata configuration for the application.
 * Includes title, description, OpenGraph, Twitter, and other SEO-related tags.
 */
export const metadata: Metadata = {
  title: {
    default: "Bloom Studio - Cheap and Powerful AI Image & Video Generator",
    template: "%s | Bloom Studio",
  },
  description:
    "Bloom Studio, a cheap and powerful AI image generator and video generator studio. Featuring NanoBanana, Veo, GPT 1.5, Seedream 4.5 and more. Try for free.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://bloomstudio.fun"),
  applicationName: "Bloom Studio",
  authors: [{ name: "Bloom Studio Team" }],
  generator: "Next.js",
  keywords: [
    "AI Image Generator",
    "Free AI Image Generator",
    "Free AI Video Generator",
    "Image Generation",
    "Video Generation",
    "Stable Diffusion",
    "Best AI Image Generator",
    "Best AI Video Generator",
    "Flux",
    "Creative",
    "Kling",
    "Image Gen",
    "Leonardo AI",
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
    canonical: "./",
  },
  /* icons are handled by file conventions in /app directory */
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Bloom Studio - Cheap and Powerful AI Image & Video Generator",
    description:
      "Bloom Studio, a cheap and powerful AI image generator and video generator studio. Featuring NanoBanana, Veo, GPT 1.5, Seedream 4.5 and more. Try for free.",
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
    title: "Bloom Studio - Cheap and Powerful AI Image & Video Generator",
    description:
      "Bloom Studio, a cheap and powerful AI image generator and video generator studio. Featuring NanoBanana, Veo, GPT 1.5, Seedream 4.5 and more. Try for free.",
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
 * Root layout component that wraps all pages in the application.
 * Provides global providers (Theme, Clerk, Convex, React Query) and basic HTML structure.
 * 
 * @param props - Component props
 * @param props.children - The child components to render within the layout
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} ${bricolage.variable} font-sans antialiased`}>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Bloom Studio",
            url: process.env.NEXT_PUBLIC_APP_URL || "https://bloomstudio.fun",
            logo: "https://bloomstudio.fun/branding/bloom-studio_logo.png",
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "",
              contactType: "customer service",
            },
          }}
        />
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

