import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("convex/server", () => ({
    httpRouter: () => ({
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
        put: vi.fn(),
    }),
}));

vi.mock("./_generated/api", () => ({
    components: {
        stripe: {},
    },
}));

// Mock registerRoutes
const registerRoutesMock = vi.fn();
vi.mock("@convex-dev/stripe", () => ({
    registerRoutes: registerRoutesMock,
}));

// Mock basic Stripe types
vi.mock("stripe", () => ({
    default: {
        Event: class {},
    }
}));

describe("http.ts", () => {
    let http: any;

    beforeEach(async () => {
        vi.resetModules();
        registerRoutesMock.mockClear();
        // Import http which triggers registerRoutes
        http = (await import("./http")).default;
    });

    it("should export an http router", () => {
        expect(http).toBeDefined();
        // Basic check that it's a router object
        expect(http.get).toBeDefined();
        expect(http.post).toBeDefined();
    });

    it("should register Stripe routes", () => {
        expect(registerRoutesMock).toHaveBeenCalledWith(
            expect.anything(), // http router
            expect.anything(), // components.stripe
            expect.objectContaining({
                webhookPath: "/stripe/webhook",
                events: expect.objectContaining({
                    "customer.subscription.created": expect.any(Function),
                    "customer.subscription.updated": expect.any(Function),
                    "customer.subscription.deleted": expect.any(Function),
                }),
                onEvent: expect.any(Function),
            })
        );
    });

    describe("Stripe event handlers", () => {
        let eventsHandler: any;
        let onEventHandler: any;

        beforeEach(() => {
            // Extract the handlers passed to registerRoutes
            const call = registerRoutesMock.mock.calls[0];
            if (call) {
                eventsHandler = call[2].events;
                onEventHandler = call[2].onEvent;
            }
        });

        it("should log on subscription creation", async () => {
            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
            const event = {
                data: { object: { id: "sub_1", status: "active" } }
            };
            
            await eventsHandler["customer.subscription.created"]({}, event);
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("New subscription created"));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("sub_1"));
        });

        it("should log on subscription update", async () => {
            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
            const event = {
                data: { object: { id: "sub_1", status: "past_due" } }
            };
            
            await eventsHandler["customer.subscription.updated"]({}, event);
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Subscription updated"));
        });

        it("should log on subscription deletion", async () => {
            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
            const event = {
                data: { object: { id: "sub_1" } }
            };
            
            await eventsHandler["customer.subscription.deleted"]({}, event);
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Subscription canceled"));
        });

        it("should log generic events", async () => {
            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
            const event = {
                type: "payment_intent.succeeded",
                id: "evt_123"
            };
            
            await onEventHandler({}, event);
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[Stripe] payment_intent.succeeded"));
        });
    });
});
