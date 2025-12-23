import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ClerkProvider } from "@clerk/nextjs"
import { QueryProvider } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "Pixelstream - Free AI Image Generation",
  description:
    "Create stunning AI-generated images with Pollinations.AI. Configure models, dimensions, and advanced parameters for free.",
  generator: "v0.app",
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <QueryProvider>
        <html lang="en" className="dark" suppressHydrationWarning>
          <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
            <Analytics />
          </body>
        </html>
      </QueryProvider>
    </ClerkProvider>
  )
}
