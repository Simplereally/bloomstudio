import { CommunityFeed } from "@/components/gallery/community-feed"
import { Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function FeedPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Community Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-lg font-bold">Pixelstream Community</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link href="/studio">
                            <Button variant="ghost" className="text-sm">Studio</Button>
                        </Link>
                        <Link href="/studio">
                            <Button size="sm" className="rounded-full px-5">Generate</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto py-12">
                <div className="px-4 mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Community Feed</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Explore the latest creations from our community of artists. High-quality AI images generated with Pixelstream.
                    </p>
                </div>

                <CommunityFeed />
            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 py-12 bg-muted/20">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        Built with passion by the Pixelstream team.
                    </p>
                </div>
            </footer>
        </div>
    )
}
