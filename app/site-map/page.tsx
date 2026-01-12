
import Link from "next/link"
import { Metadata } from "next"
import { RESOURCES, SOLUTIONS } from "@/lib/seo-config"

export const metadata: Metadata = {
    title: "Sitemap | Bloom Studio",
    description: "Overview of all pages and solutions available on Bloom Studio.",
}

export default function SitemapPage() {
    const mainPages = [
        { name: "Home", href: "/" },
        ...RESOURCES.filter(r => r.href !== "/sitemap"), // Avoid self-ref loop if added to resources
        { name: "Sign Up", href: "/sign-up" },
        { name: "Sign In", href: "/sign-in" },
    ]

    const legalPages = [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
    ]

    return (
        <div className="container mx-auto px-6 py-24 md:py-32">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-brand tracking-tight">
                Sitemap
            </h1>
            <p className="text-xl text-muted-foreground mb-16 max-w-2xl">
                An overview of the available content and tools on Bloom Studio.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {/* Main Pages */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold border-b border-white/10 pb-4">
                        General
                    </h2>
                    <ul className="space-y-3">
                        {mainPages.map((page) => (
                            <li key={page.href}>
                                <Link 
                                    href={page.href}
                                    className="text-muted-foreground hover:text-primary transition-colors block py-1"
                                >
                                    {page.name}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <h2 className="text-2xl font-semibold border-b border-white/10 pb-4 mt-12">
                        Legal
                    </h2>
                    <ul className="space-y-3">
                        {legalPages.map((page) => (
                            <li key={page.href}>
                                <Link 
                                    href={page.href}
                                    className="text-muted-foreground hover:text-primary transition-colors block py-1"
                                >
                                    {page.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Solutions */}
                <div className="space-y-6 lg:col-span-2">
                    <h2 className="text-2xl font-semibold border-b border-white/10 pb-4">
                        Solutions
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                        {SOLUTIONS.map((solution) => (
                            <div key={solution.slug}>
                                <Link 
                                    href={`/solutions/${solution.slug}`}
                                    className="text-muted-foreground hover:text-primary transition-colors block py-2 group"
                                >
                                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                                        {solution.title}
                                    </span>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
