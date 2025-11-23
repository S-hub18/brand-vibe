import { LLMClient } from "@/lib/llm/client"
import { INSTAGRAM_SPECIALIST_PROMPT, BRAND_CONTEXT_SYSTEM, buildContentGenerationPrompt } from "@/lib/llm/prompts"
import { BrandKit } from "@/types/brand"
import { ContentContext } from "@/types/content"
import { getModel } from "@/lib/config/models"

export interface InstagramPost {
    caption: string
    hashtags: string[]
    visualDescription: string
}

export class InstagramContentAgent {
    private llm: LLMClient

    constructor() {
        this.llm = new LLMClient(getModel('SOCIAL_MEDIA'))
    }

    async generateContent(brandKit: BrandKit, context: ContentContext): Promise<InstagramPost[]> {
        const systemPrompt = `
${INSTAGRAM_SPECIALIST_PROMPT}
${BRAND_CONTEXT_SYSTEM(brandKit)}

Output format: JSON array of objects.
Example: [{ "caption": "...", "hashtags": ["#tag"], "visualDescription": "..." }]
`
        const userPrompt = buildContentGenerationPrompt(brandKit, 'INSTAGRAM', context)

        const response = await this.llm.generateJson<InstagramPost[]>(userPrompt, {
            systemPrompt,
            temperature: 0.7,
        })

        return response
    }
}
