import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Sign In",
  robots: {
    index: false,
    follow: true,
  },
}

export default function SignInLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return children
}
