import { LLMClient } from "@/lib/llm/client"
import { ORCHESTRATOR_SYSTEM_PROMPT, BRAND_CONTEXT_SYSTEM } from "@/lib/llm/prompts"
import { BrandKit } from "@/types/brand"
import { OrchestratorResponse } from "@/types/agent"
import { getModel } from "@/lib/config/models"

export class OrchestratorAgent {
    private llm: LLMClient

    constructor() {
        this.llm = new LLMClient(getModel('ORCHESTRATOR'))
    }

    async processRequest(userRequest: string, brandKit: BrandKit): Promise<OrchestratorResponse> {
        console.log("[Orchestrator] Processing request:", userRequest)
        console.log("[Orchestrator] Brand Kit:", brandKit.companyName)

        try {
            const userPrompt = `
User Request: "${userRequest}"

Analyze this request and determine which content platform is most appropriate:
- TWITTER: Short-form posts, tweets, quick updates (280 chars)
- INSTAGRAM: Visual posts with captions and hashtags
- LINKEDIN: Professional articles, thought leadership
- POSTER: Visual design, images, banners, ads

You MUST respond with ONLY valid JSON in this EXACT format:
{
  "agent": "TWITTER",
  "parameters": {
    "topic": "extracted topic",
    "tone": "casual/professional/playful",
    "keywords": ["key1", "key2"]
  },
  "confidence": 0.9,
  "clarificationNeeded": false,
  "clarificationQuestions": []
}

The "agent" field MUST be one of: "TWITTER", "INSTAGRAM", "LINKEDIN", or "POSTER".
Do NOT return any other format. Do NOT generate actual content.
`

            const systemPrompt = `You are a routing assistant for BrandVibe. Your job is to analyze user requests and determine the best content platform. You MUST return valid JSON with an "agent" field set to exactly one of: TWITTER, INSTAGRAM, LINKEDIN, or POSTER.

Brand Context:
- Company: ${brandKit.companyName}
- Tone: ${brandKit.tone || 'professional'}
- Audience: ${brandKit.audienceDescription || 'general'}

Return ONLY the JSON object, nothing else.`

            // Define JSON schema for strict response format
            const responseSchema = {
                type: "object",
                properties: {
                    agent: {
                        type: "string",
                        enum: ["TWITTER", "INSTAGRAM", "LINKEDIN", "POSTER"]
                    },
                    parameters: {
                        type: "object",
                        properties: {
                            topic: { type: "string" },
                            tone: { type: "string" },
                            keywords: {
                                type: "array",
                                items: { type: "string" }
                            }
                        }
                    },
                    confidence: {
                        type: "number",
                        minimum: 0,
                        maximum: 1
                    },
                    clarificationNeeded: {
                        type: "boolean"
                    },
                    clarificationQuestions: {
                        type: "array",
                        items: { type: "string" }
                    }
                },
                required: ["agent", "parameters", "confidence", "clarificationNeeded"]
            }

            console.log("[Orchestrator] Calling LLM for routing decision...")

            // Add timeout to prevent indefinite hangs
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Orchestrator timeout after 30 seconds")), 30000)
            )

            const llmPromise = this.llm.generateJson<OrchestratorResponse>(userPrompt, {
                systemPrompt,
                temperature: 0.1, // Very low temperature for consistent routing
                jsonSchema: responseSchema as any
            })

            const response = await Promise.race([llmPromise, timeoutPromise])

            console.log("[Orchestrator] Received response:", JSON.stringify(response, null, 2))

            // Validate and fix response if needed
            if (!response.agent || !['TWITTER', 'INSTAGRAM', 'LINKEDIN', 'POSTER', 'ORCHESTRATOR'].includes(response.agent)) {
                console.warn("[Orchestrator] Invalid agent type received:", response.agent, "- defaulting to TWITTER")
                response.agent = 'TWITTER' as any
            }

            if (!response.parameters) {
                console.warn("[Orchestrator] No parameters in response, using defaults")
                response.parameters = {}
            }

            if (response.confidence === undefined) {
                response.confidence = 0.5
            }

            if (response.clarificationNeeded === undefined) {
                response.clarificationNeeded = false
            }

            console.log("[Orchestrator] Routing to agent:", response.agent)
            return response
        } catch (error) {
            console.error("[Orchestrator] ERROR during processing:", error)
            console.error("[Orchestrator] Error details:", error instanceof Error ? error.message : String(error))

            // Return a fallback response to prevent complete failure
            console.warn("[Orchestrator] Returning fallback TWITTER routing due to error")
            return {
                agent: 'TWITTER' as any,
                parameters: {
                    topic: userRequest,
                    tone: brandKit.tone || 'professional',
                    keywords: []
                },
                confidence: 0.3,
                clarificationNeeded: false,
                clarificationQuestions: []
            }
        }
    }
}
