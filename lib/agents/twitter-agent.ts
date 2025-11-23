import { LLMClient } from "@/lib/llm/client"
import { TWITTER_SPECIALIST_PROMPT, BRAND_CONTEXT_SYSTEM, buildContentGenerationPrompt } from "@/lib/llm/prompts"
import { BrandKit } from "@/types/brand"
import { ContentContext } from "@/types/content"
import { getModel } from "@/lib/config/models"

export class TwitterContentAgent {
    private llm: LLMClient

    constructor() {
        this.llm = new LLMClient(getModel('SOCIAL_MEDIA'))
    }

    async generateContent(brandKit: BrandKit, context: ContentContext): Promise<string[]> {
        const systemPrompt = `
${TWITTER_SPECIALIST_PROMPT}
${BRAND_CONTEXT_SYSTEM(brandKit)}

Output format: JSON array of strings (tweets).
Example: ["Tweet 1...", "Tweet 2..."]
`
        const userPrompt = buildContentGenerationPrompt(brandKit, 'TWITTER', context)

        const response = await this.llm.generateJson<string[]>(userPrompt, {
            systemPrompt,
            temperature: 0.7,
        })

        return response
    }
}
