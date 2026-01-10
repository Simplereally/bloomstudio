
import { Footer } from "@/components/layout/footer"
import { FaqSection } from "@/components/landing/faq-section"
import { LandingHeader } from "@/components/landing/landing-header"

export default function FaqPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <LandingHeader />

            <main className="flex-1">
                <div className="pt-32 pb-20 text-center">
                    <h1 className="text-4xl font-bold mb-4">Help & FAQ</h1>
                    <p className="text-muted-foreground">Find answers to common questions about Bloom Studio.</p>
                </div>
                <FaqSection />
            </main>

            <Footer />
        </div>
    )
}
