import type { MetadataRoute } from "next"
import { SOLUTIONS } from "@/lib/seo-config"
import { MODEL_SEO_SLUGS } from "@/lib/models/model-seo-slugs"

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bloomstudio.fun"
    const now = new Date()

    const solutions = SOLUTIONS.map((solution) => ({
        url: `${baseUrl}/solutions/${solution.slug}`,
        lastModified: now,
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
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: route === "" ? 1 : 0.8,
    }))

    // Feed page - crawlable for SEO (showcases community content)
    const feedPages = [
        {
            url: `${baseUrl}/feed/public`,
            lastModified: now,
            changeFrequency: "hourly" as const, // Feed updates frequently
            priority: 0.9, // High priority - great discovery content
        },
    ]

    // ── Model SEO Pages ─────────────────────────────────────────────────
    // /models index
    const modelIndexPage: MetadataRoute.Sitemap[number] = {
        url: `${baseUrl}/models`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.9,
    }

    // Priority by category: create 0.8, edit 0.7, features 0.7
    const categoryPriority: Record<string, number> = {
        create: 0.8,
        edit: 0.7,
        features: 0.7,
    }
    const categoryChangeFreq: Record<string, "weekly" | "monthly"> = {
        create: "weekly",
        edit: "monthly",
        features: "monthly",
    }

    const modelPages: MetadataRoute.Sitemap = MODEL_SEO_SLUGS.flatMap((entry) =>
        entry.categories.map((category) => ({
            url: `${baseUrl}/models/${entry.slug}/${category}`,
            lastModified: now,
            changeFrequency: categoryChangeFreq[category] ?? ("monthly" as const),
            priority: categoryPriority[category] ?? 0.7,
        })),
    )

    return [
        ...staticPages,
        ...feedPages,
        ...solutions,
        modelIndexPage,
        ...modelPages,
    ]
}
