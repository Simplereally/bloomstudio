export interface PromptAnalysisResult {
    isSensitive: boolean;
    confidence: number;
    matchedTerms: string[];
    detectionMethod: "explicit" | "contextual" | "none";
}

// Explicit NSFW terms that strongly suggest sensitive content
const EXPLICIT_KEYWORDS = new Set([
    "nude", "naked", "nsfw", "explicit", "porn", "pornographic",
    "erotic", "xxx", "uncensored", "hentai", "topless",
    "sex", "sexual", "organs", "genitals", "penis", "vagina",
    "clitoris", "boobs", "ass", "tits", "cock", "dick",
    "cum", "blowjob", "anal", "oral", "penetration",
    "erotica", "fetish", "bondage", "sadism", "masochism"
]);

// Suggestive terms that might be sensitive depending on context
const SUGGESTIVE_KEYWORDS = new Set([
    "seductive", "provocative", "sensual", "revealing",
    "bikini", "lingerie", "boudoir", "undressed", "stripping",
    "pinup", "pin-up", "skimpy"
]);

// Body parts often associated with sensitive content
const BODY_PARTS = new Set([
    "breast", "butt", "thigh", "cleavage", "chest", "leg", "groin",
    "crotch"
]);

// Modifiers that when combined with body parts suggest sensitive content
const CONTEXT_MODIFIERS = new Set([
    "exposed", "bare", "showing", "flashing", "open", "raw",
    "detailed", "close-up", "massive", "huge", "big"
]);

export function analyzePromptForNSFW(prompt: string): PromptAnalysisResult {
    if (!prompt) {
        return {
            isSensitive: false,
            confidence: 0,
            matchedTerms: [],
            detectionMethod: "none"
        };
    }

    const normalizedPrompt = prompt.toLowerCase();
    // Improved tokenizer: split by non-word characters but keep internal apostrophes/hyphens if needed
    // Simple split by whitespace and common punctuation for now is usually sufficient
    const words = normalizedPrompt.split(/[\s,.;:!?()\[\]"']+/).filter(w => w.length > 0);
    
    const matchedTerms: string[] = [];
    let score = 0;
    
    // Check explicit and suggestive keywords
    for (const word of words) {
        if (EXPLICIT_KEYWORDS.has(word)) {
            matchedTerms.push(word);
            score += 0.9;
        } else if (SUGGESTIVE_KEYWORDS.has(word)) {
            matchedTerms.push(word);
            score += 0.4;
        }
    }
    
    // Check body part + context modifier combinations
    // We look for proximity or just co-occurrence in the prompt
    // For simplicity/perf, we check global co-occurrence in the prompt
    const hasBodyPart = words.some(w => BODY_PARTS.has(w));
    const hasModifier = words.some(w => CONTEXT_MODIFIERS.has(w));
    
    if (hasBodyPart && hasModifier) {
        score += 0.7;
    }
    
    // Normalize score to 0-1 range
    const confidence = Math.min(score, 1);
    
    // Use the matched terms to determine method
    let detectionMethod: "explicit" | "contextual" | "none" = "none";
    if (matchedTerms.length > 0) {
        detectionMethod = "explicit";
    } else if (hasBodyPart && hasModifier) {
        detectionMethod = "contextual";
    }
    
    return {
        // Threshold of 0.6 means one explicit term (0.9) OR suggestive (0.4) + contextual(0.5) = 0.9 -> sensitive
        // suggestive (0.4) alone -> not sensitive
        isSensitive: confidence >= 0.6,
        confidence,
        matchedTerms,
        detectionMethod
    };
}
