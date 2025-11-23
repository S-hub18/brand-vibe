import { LLMClient } from "@/lib/llm/client"
import { LINKEDIN_SPECIALIST_PROMPT, BRAND_CONTEXT_SYSTEM, buildContentGenerationPrompt } from "@/lib/llm/prompts"
import { BrandKit } from "@/types/brand"
import { ContentContext } from "@/types/content"
import { getModel } from "@/lib/config/models"

export interface LinkedInPost {
    content: string
    hashtags: string[]
}

export class LinkedInContentAgent {
    private llm: LLMClient

    constructor() {
        this.llm = new LLMClient(getModel('SOCIAL_MEDIA'))
    }

    async generateContent(brandKit: BrandKit, context: ContentContext): Promise<LinkedInPost[]> {
        const systemPrompt = `
${LINKEDIN_SPECIALIST_PROMPT}
${BRAND_CONTEXT_SYSTEM(brandKit)}

Output format: JSON array of objects.
Example: [{ "content": "...", "hashtags": ["#tag"] }]
`
        const userPrompt = buildContentGenerationPrompt(brandKit, 'LINKEDIN', context)

        const response = await this.llm.generateJson<LinkedInPost[]>(userPrompt, {
            systemPrompt,
            temperature: 0.7,
        })

        return response
    }
}
