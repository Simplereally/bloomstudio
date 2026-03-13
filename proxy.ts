import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

/**
 * Route matcher for protected routes that require authentication.
 * These routes will redirect to sign-in if accessed while unauthenticated.
 */
export const isProtectedRoute = createRouteMatcher([
  '/studio(.*)',
  '/settings(.*)',
  '/history(.*)',
  '/favorites(.*)',
  '/feed/following',
  '/api/upload(.*)',
  '/api/images/delete(.*)',
])

/**
 * Clerk middleware for authentication enforcement at the edge.
 * 
 * This middleware runs before every request and:
 * - Checks if the route is protected
 * - Redirects unauthenticated users to sign-in for protected routes
 * - Allows all other routes to pass through
 */
export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname === "/") {
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-bloom-public-shell", "maintenance")

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  if (isProtectedRoute(req)) await auth.protect()
})

/**
 * Middleware configuration object.
 * Defines the matcher patterns for routes where the middleware should execute.
 */
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}

