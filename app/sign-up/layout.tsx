import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Sign Up",
  robots: {
    index: false,
    follow: true,
  },
}

export default function SignUpLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return children
}
