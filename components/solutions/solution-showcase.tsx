


import { cn } from "@/lib/utils"
import { ScrollReveal } from "@/components/landing/scroll-reveal"
import { Slideshow, SlideshowSlide } from "@/components/ui/slideshow"
import { ShowcaseImage } from "@/components/landing/showcase-image"

interface SolutionShowcaseProps {
    items?: {
        label: string
        aspectRatio: "square" | "portrait" | "landscape" | "landscape-wide" | "portrait-tall"
        className?: string
        src?: string
    }[]
    aspectRatio?: string
}

export function SolutionShowcase({ items, aspectRatio = "16/9" }: SolutionShowcaseProps) {
    const displayItems = items || []

    // Transform items into slideshow slides
    const slides: SlideshowSlide[] = displayItems.map((item, index) => ({
        key: index,
        label: item.label,
        thumbnailSrc: item.src,
        content: (
            <ShowcaseImage
                label={item.label}
                aspectRatio={item.aspectRatio}
                className="h-full w-full"
                src={item.src}
            />
        ),
    }))

    return (
        <section className="py-16 md:py-20 lg:py-24 xl:py-28 2xl:py-32 relative overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 xl:gap-8 items-center">
                    {/* Left Side: Text Content */}
                    <ScrollReveal className="lg:col-span-5 xl:col-span-4 lg:pr-4">
                        <div className="text-left">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 lg:mb-6">
                                See what you can create
                            </h2>
                            <p className="text-base lg:text-lg xl:text-xl text-muted-foreground mb-4 lg:mb-6 text-balance max-w-lg xl:max-w-xl">
                                From photorealistic renders to artistic illustrations, bring any vision to life with our state-of-the-art AI generation tools.
                            </p>
                        </div>
                    </ScrollReveal>

                    {/* Right Side: Slideshow */}
                    <ScrollReveal delay={200} className="w-full flex justify-center lg:justify-end lg:col-span-7 xl:col-span-8">
                        <Slideshow
                            slides={slides}
                            className={cn(
                                "w-full max-w-[480px] sm:max-w-[560px] md:max-w-[640px] lg:max-w-[700px] xl:max-w-full 2xl:max-w-full",
                                aspectRatio !== "1/1" && "[&>div:first-child]:w-full"
                            )}
                            aspectRatio={aspectRatio}
                            frameClassName={cn(
                                aspectRatio === "1/1"
                                    ? "h-[320px] sm:h-[380px] md:h-[440px] lg:h-[480px] xl:h-[520px] 2xl:h-[580px]"
                                    : "w-full"
                            )}
                            thumbnailClassName={cn(
                                aspectRatio !== "1/1" && "aspect-video w-24 h-auto sm:w-28 sm:h-auto md:w-32 md:h-auto"
                            )}
                            showInfo={true}
                            showThumbnails={true}
                            showProgress={false}
                            options={{
                                autoAdvanceDelay: 3000,
                                visibilityThreshold: 0.7,
                            }}
                        />
                    </ScrollReveal>
                </div>
            </div>
        </section>
    )
}
