import type { MetadataRoute } from "next"

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
