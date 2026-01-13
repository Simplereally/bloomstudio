import type { MetadataRoute } from "next"
import { SOLUTIONS } from "@/lib/seo-config"

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bloomstudio.fun"

    const solutions = SOLUTIONS.map((solution) => ({
        url: `${baseUrl}/solutions/${solution.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }))

    const staticPages = [
        "",
        "/about",
        "/pricing",
        "/faq",
        "/contact",
        "/support",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: route === "" ? 1 : 0.8,
    }))

    // Feed page - crawlable for SEO (showcases community content)
    const feedPages = [
        {
            url: `${baseUrl}/feed/public`,
            lastModified: new Date(),
            changeFrequency: "hourly" as const, // Feed updates frequently
            priority: 0.9, // High priority - great discovery content
        },
    ]

    return [...staticPages, ...feedPages, ...solutions]
}
