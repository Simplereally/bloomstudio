import { Footer } from "@/components/layout/footer";
import { JsonLd } from "@/components/seo/json-ld";
import Link from "next/link";

/**
 * Temporary maintenance landing page.
 */
export default function LandingPage() {
  return (
    <div className="dark">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Bloom Studio",
          applicationCategory: "DesignApplication",
          operatingSystem: "Web Browser",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          description: "Cheap and powerful AI image and video generator studio.",
        }}
      />
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#3b1607_0%,#140904_28%,#050505_58%,#020202_100%)] text-white">
        <div className="border-b border-white/10 bg-black/50">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <Link href="/" className="text-2xl font-bold text-primary font-brand tracking-tight -skew-x-6">
              Bloom Studio
            </Link>
            <div className="rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
              Service Interruption
            </div>
          </div>
        </div>

        <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl items-center px-6 py-16">
          <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-8">
              <div className="inline-flex items-center rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100">
                Bloom Studio is currently inaccessible.
              </div>
              <div className="space-y-5">
                <h1 className="max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Bloom Studio is currently in maintenance mode.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
                  The application is temporarily unavailable while we work on restoring service.
                  Thank you for your patience.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/support"
                  className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground"
                >
                  Contact Support
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/85"
                >
                  Read FAQ
                </Link>
              </div>
            </section>

            <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">Status</p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-white/72">
                    <li>The app is temporarily unavailable.</li>
                    <li>We are working to bring it back online.</li>
                    <li>Updates will be shared once service is restored.</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">Need help?</p>
                  <p className="mt-4 text-sm leading-7 text-white/72">
                    If you need assistance, contact support and we will follow up as soon as possible.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
