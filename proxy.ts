import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

/**
 * Route matcher for protected routes that require authentication.
 * These routes will redirect to sign-in if accessed while unauthenticated.
 */
export const isProtectedRoute = createRouteMatcher([
  '/studio(.*)',
  '/settings(.*)',
  '/history(.*)',
  '/favorites(.*)',
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

