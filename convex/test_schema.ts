import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
    test: defineTable({
        clerkId: v.string(),
    })
        .index("by_clerk_id", ["clerkId"])
        // @ts-ignore
        .index("by_clerk_id_unique", ["clerkId"]).unique(),
})
