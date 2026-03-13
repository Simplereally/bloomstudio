import { Footer } from "@/components/layout/footer";
import { JsonLd } from "@/components/seo/json-ld";
import Link from "next/link";

/**
 * Temporary maintenance landing page.
 *
 * IMPORTANT:
 * Keep this route fully static and server-rendered.
 * Do not import auth, Clerk, Convex, or other client app-shell code here
 * while the public site is intentionally gated.
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
                  We have temporarily taken the application offline.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
                  The public app and studio are under temporary maintenance while we stabilize the backend.
                  The homepage is intentionally running in a stripped-down SSR mode so it does not touch the
                  normal Convex-driven app shell.
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
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
                    What is disabled
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-white/72">
                    <li>Studio generation and media processing</li>
                    <li>Authentication-dependent app chrome</li>
                    <li>Public landing page interactions that rely on the app shell</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
                    Temporary routing note
                  </p>
                  <p className="mt-4 text-sm leading-7 text-white/72">
                    This page is intentionally minimal and should remain free of Clerk or Convex calls until the
                    application is reopened.
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
