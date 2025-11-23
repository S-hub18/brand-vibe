/**
 * Centralized model configuration
 * All AI models can be configured from environment variables
 *
 * IMPORTANT: All models must support JSON mode (text generation models).
 * Do NOT use image generation models (e.g., gemini-2.5-flash-image) here.
 */

export const MODEL_CONFIG = {
    // Main LLM model for content generation
    CONTENT_GENERATION: process.env.CONTENT_GENERATION_MODEL || "gemini-1.5-flash",

    // Model for orchestration/routing
    ORCHESTRATOR: process.env.ORCHESTRATOR_MODEL || "gemini-1.5-flash",

    // Model for poster/design prompt engineering (text-based, NOT image generation)
    // This model creates prompts for image generators, it doesn't generate images
    POSTER: process.env.POSTER_MODEL || "gemini-1.5-flash",

    // Model for social media content (Twitter, Instagram, LinkedIn)
    SOCIAL_MEDIA: process.env.SOCIAL_MEDIA_MODEL || "gemini-1.5-flash",
} as const

/**
 * Available Gemini models:
 * - gemini-1.5-flash (Fast, cost-effective)
 * - gemini-1.5-flash-8b (Fastest, most cost-effective)
 * - gemini-1.5-pro (Most capable, slower, higher cost)
 * - gemini-2.0-flash-exp (Experimental)
 */

export type ModelName = string

/**
 * Get model name for a specific use case
 */
export function getModel(type: keyof typeof MODEL_CONFIG): ModelName {
    return MODEL_CONFIG[type]
}
