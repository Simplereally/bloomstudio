import { track } from "@vercel/analytics"

// ============================================================
// Analytics Event Types
// ============================================================

/**
 * Events for tracking conversion funnel on the public feed.
 * Feed → Sign-up → First creation
 */
export type FeedAnalyticsEvent =
    | "feed_view"              // User viewed the feed
    | "feed_image_click"       // User clicked an image in feed
    | "feed_lightbox_open"     // User opened lightbox
    | "feed_cta_view"          // CTA became visible
    | "feed_cta_click"         // User clicked CTA sign-up button
    | "feed_cta_dismiss"       // User dismissed CTA
    | "feed_copy_prompt"       // User copied a prompt
    | "feed_video_play"        // User played a video

/**
 * Properties that can be attached to feed analytics events.
 * Uses Record type for Vercel Analytics compatibility.
 */
export type FeedAnalyticsProperties = {
    /** Whether the user is authenticated */
    isAuthenticated?: boolean
    /** Type of feed (public or following) */
    feedType?: "public" | "following"
    /** Location where the action occurred */
    location?: "feed" | "lightbox" | "cta"
    /** Type of content (image or video) */
    contentType?: "image" | "video"
    /** Time spent in seconds (for engagement tracking) */
    timeSpentSeconds?: number
    /** Scroll depth percentage when event occurred */
    scrollDepthPercent?: number
} & Record<string, string | number | boolean | null | undefined>


// ============================================================
// Analytics Tracking Functions
// ============================================================

/**
 * Track a feed-related analytics event.
 * 
 * @param event - The event name to track
 * @param properties - Optional properties to attach to the event
 */
export function trackFeedEvent(
    event: FeedAnalyticsEvent,
    properties?: FeedAnalyticsProperties
): void {
    try {
        track(event, properties ?? {})
    } catch (error) {
        // Silently fail if analytics is blocked or unavailable
        console.debug("[Analytics] Failed to track event:", event, error)
    }
}

/**
 * Track when the feed page is viewed.
 * 
 * @param feedType - The type of feed being viewed
 * @param isAuthenticated - Whether the viewer is signed in
 */
export function trackFeedView(
    feedType: "public" | "following",
    isAuthenticated: boolean
): void {
    trackFeedEvent("feed_view", {
        feedType,
        isAuthenticated,
    })
}

/**
 * Track when a user clicks on an image in the feed.
 * 
 * @param contentType - Whether the content is an image or video
 * @param isAuthenticated - Whether the viewer is signed in
 */
export function trackImageClick(
    contentType: "image" | "video",
    isAuthenticated: boolean
): void {
    trackFeedEvent("feed_image_click", {
        contentType,
        isAuthenticated,
        location: "feed",
    })
}

/**
 * Track when the lightbox is opened.
 * 
 * @param contentType - Whether the content is an image or video
 * @param isAuthenticated - Whether the viewer is signed in
 */
export function trackLightboxOpen(
    contentType: "image" | "video",
    isAuthenticated: boolean
): void {
    trackFeedEvent("feed_lightbox_open", {
        contentType,
        isAuthenticated,
        location: "lightbox",
    })
}

/**
 * Track when the feed CTA becomes visible.
 */
export function trackCtaView(): void {
    trackFeedEvent("feed_cta_view", {
        isAuthenticated: false,
        location: "cta",
    })
}

/**
 * Track when the user clicks the CTA sign-up button.
 */
export function trackCtaClick(): void {
    trackFeedEvent("feed_cta_click", {
        isAuthenticated: false,
        location: "cta",
    })
}

/**
 * Track when the user dismisses the CTA.
 */
export function trackCtaDismiss(): void {
    trackFeedEvent("feed_cta_dismiss", {
        isAuthenticated: false,
        location: "cta",
    })
}

/**
 * Track when a user copies a prompt.
 * 
 * @param location - Where the copy action occurred
 * @param isAuthenticated - Whether the viewer is signed in
 */
export function trackPromptCopy(
    location: "feed" | "lightbox",
    isAuthenticated: boolean
): void {
    trackFeedEvent("feed_copy_prompt", {
        location,
        isAuthenticated,
    })
}

/**
 * Track when a user plays a video.
 * 
 * @param isAuthenticated - Whether the viewer is signed in
 */
export function trackVideoPlay(isAuthenticated: boolean): void {
    trackFeedEvent("feed_video_play", {
        contentType: "video",
        isAuthenticated,
        location: "feed",
    })
}
