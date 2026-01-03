/**
 * Random Username Generator
 *
 * Generates fun, memorable usernames like "SunnyAudioCat" or "BlackenedCardboardCoin"
 * Uses adjective + noun combinations for privacy-preserving display names.
 */

const ADJECTIVES = [
    "Sunny", "Cosmic", "Electric", "Mystic", "Crystal", "Shadow", "Golden", "Silver",
    "Frozen", "Blazing", "Starlit", "Moonlit", "Velvet", "Crimson", "Azure", "Emerald",
    "Midnight", "Radiant", "Silent", "Thunder", "Neon", "Prism", "Copper", "Sapphire",
    "Obsidian", "Pearl", "Iron", "Maple", "Cedar", "Willow", "Coral", "Sage",
    "Storm", "Dawn", "Dusk", "Amber", "Violet", "Jade", "Onyx", "Ruby",
    "Quantum", "Stellar", "Digital", "Analog", "Binary", "Pixel", "Vector", "Fractal",
    "Swift", "Bold", "Clever", "Gentle", "Wild", "Calm", "Fierce", "Bright",
    "Hollow", "Solid", "Liquid", "Vapor", "Dusty", "Sleek", "Rustic", "Polished",
    "Ancient", "Modern", "Retro", "Future", "Classic", "Abstract", "Vivid", "Subtle",
    "Hidden", "Floating", "Dancing", "Spinning", "Glowing", "Fading", "Rising", "Falling"
]

const NOUNS = [
    "Phoenix", "Dragon", "Tiger", "Wolf", "Falcon", "Raven", "Owl", "Fox",
    "Panda", "Koala", "Otter", "Dolphin", "Whale", "Shark", "Eagle", "Hawk",
    "Crystal", "Meteor", "Comet", "Nebula", "Galaxy", "Pulsar", "Quasar", "Nova",
    "Circuit", "Pixel", "Cipher", "Matrix", "Vector", "Prism", "Spark", "Beacon",
    "Forest", "Mountain", "Ocean", "River", "Valley", "Canyon", "Glacier", "Desert",
    "Lotus", "Rose", "Orchid", "Fern", "Willow", "Maple", "Cedar", "Pine",
    "Thunder", "Lightning", "Storm", "Aurora", "Rainbow", "Eclipse", "Horizon", "Zenith",
    "Marble", "Bronze", "Titanium", "Carbon", "Quartz", "Diamond", "Sapphire", "Opal",
    "Voyager", "Pioneer", "Seeker", "Dreamer", "Maker", "Builder", "Crafter", "Weaver",
    "Echo", "Whisper", "Rumble", "Chime", "Melody", "Rhythm", "Harmony", "Symphony"
]

/**
 * Generate a random username combining adjective + noun + optional number
 * Example outputs: "CosmicPhoenix", "SilentOwl42", "NeonDragon7"
 */
export function generateRandomUsername(): string {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]

    // 50% chance to add a short number suffix for uniqueness
    const addNumber = Math.random() > 0.5
    const suffix = addNumber ? Math.floor(Math.random() * 99) + 1 : ""

    return `${adjective}${noun}${suffix}`
}
