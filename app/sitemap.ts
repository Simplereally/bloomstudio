import type { MetadataRoute } from "next"

/**
 * Produce the sitemap configuration for the application.
 *
 * The returned array contains sitemap entries for the site; the root entry's URL is taken from `NEXT_PUBLIC_APP_URL` or falls back to "https://bloomstudio.fun", with `lastModified` set to the current time, `changeFrequency` set to `"daily"`, and `priority` set to `1`.
 *
 * @returns An array of sitemap entries for the site, including the root entry described above.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bloomstudio.fun"

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        // Add other static pages here
    ]
}