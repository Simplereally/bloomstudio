import type { MetadataRoute } from "next"

/**
 * Create the Next.js robots metadata describing crawl rules and sitemap location.
 *
 * The sitemap URL is constructed from the NEXT_PUBLIC_APP_URL environment variable, falling back to "https://bloomstudio.fun" when unset.
 *
 * @returns A MetadataRoute.Robots object with crawling rules (userAgent `"*"`, allow `"/"`, disallow `["/api/", "/studio/"]`) and `sitemap` set to the site's sitemap URL.
 */
export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bloomstudio.fun"

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/studio/"], // Disallow private/internal paths if needed, but usually studio might be public?
            // Keeping it simple for now, usually you want to allow everything unless it's strictly private
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}