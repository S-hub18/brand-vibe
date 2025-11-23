import { LLMClient } from "@/lib/llm/client"
import { POSTER_CLARIFICATION_PROMPT, POSTER_PROMPT_ENGINEER_SYSTEM_PROMPT, buildPosterPromptEngineeringPrompt } from "@/lib/llm/prompts"
import { BrandKit } from "@/types/brand"
import { PosterSession, GatheredInfo, ConversationTurn } from "@/types/poster"
import { getModel } from "@/lib/config/models"

export class PosterAgent {
    private llm: LLMClient

    constructor() {
        this.llm = new LLMClient(getModel('POSTER'))
    }

    async startPosterCreation(brandKit: BrandKit, userDescription: string): Promise<{ questions: string[], gatheredInfo: GatheredInfo }> {
        // Initial analysis
        const systemPrompt = `
${POSTER_CLARIFICATION_PROMPT}

User Initial Request: "${userDescription}"

Analyze what information is missing.
Return JSON:
{
  "questions": ["question1", "question2"],
  "gatheredInfo": { ...extracted info... }
}
`
        const response = await this.llm.generateJson<{ questions: string[], gatheredInfo: GatheredInfo }>(userDescription, {
            systemPrompt,
            temperature: 0.3,
        })

        return response
    }

    async generateImagePrompt(brandKit: BrandKit, gatheredInfo: GatheredInfo): Promise<string> {
        const colors = brandKit.colors || {}
        const brandColors = colors as any

        // Format colors clearly
        const primaryColor = brandColors?.primary || '#000000'
        const secondaryColor = brandColors?.secondary || '#ffffff'
        const accentColor = brandColors?.accent
        const paletteColors = brandColors?.palette || []

        // Build comprehensive color palette description
        let colorPalette = `Primary: ${primaryColor}, Secondary: ${secondaryColor}`
        if (accentColor) {
            colorPalette += `, Accent: ${accentColor}`
        }
        if (paletteColors.length > 0) {
            colorPalette += `, Additional: ${paletteColors.join(', ')}`
        }

        // Format dimensions
        const dimensions = gatheredInfo.dimensions || '1024x1024'
        let formatDesc = 'square'
        if (dimensions.includes('16:9') || dimensions.toLowerCase().includes('horizontal')) formatDesc = 'horizontal 16:9 banner'
        else if (dimensions.includes('9:16') || dimensions.toLowerCase().includes('vertical')) formatDesc = 'vertical 9:16 poster'
        else if (dimensions.includes('1920') || dimensions.includes('1080')) formatDesc = 'wide horizontal banner'

        // Analyze message for marketing intent
        const message = gatheredInfo.message || brandKit.companyName || 'Special Offer'
        const hasDiscount = /\d+%|\boff\b|\bsale\b|\bsave\b/i.test(message)
        const hasUrgency = /\blimited\b|\bnow\b|\btoday\b|\bhurry\b|\bending\b/i.test(message)
        const isLaunch = /\bnew\b|\blaunching\b|\barrival\b|\bintroducing\b/i.test(message)
        const isFree = /\bfree\b|\bcomplimentary\b|\bno cost\b/i.test(message)

        // Determine marketing goal
        let marketingGoal = 'brand awareness'
        if (hasDiscount) marketingGoal = 'sale/discount promotion'
        else if (hasUrgency) marketingGoal = 'urgency-driven conversion'
        else if (isLaunch) marketingGoal = 'product launch'
        else if (isFree) marketingGoal = 'lead generation'

        // Suggest color psychology using available brand colors
        let colorPsychology = 'brand colors for consistency'
        if (hasDiscount || hasUrgency) {
            // Use accent or palette colors if available for urgency
            colorPsychology = accentColor
                ? `${accentColor} accents for urgency, high contrast with ${primaryColor}`
                : 'red accents for urgency, high contrast'
        } else if (isLaunch) {
            colorPsychology = accentColor
                ? `${accentColor} highlights for excitement`
                : 'gold/yellow highlights for excitement'
        } else if (isFree) {
            colorPsychology = 'green accents for positive action'
        }

        // If palette colors available, mention them as options
        if (paletteColors.length > 0) {
            colorPsychology += ` (can use palette: ${paletteColors.slice(0, 3).join(', ')})`
        }

        // Suggest conversion elements
        const conversionElements = []
        if (hasDiscount) conversionElements.push('price tag badge', 'percentage highlight', 'sale ribbon')
        if (hasUrgency) conversionElements.push('urgency indicators', 'countdown visual', 'limited time badge')
        if (isLaunch) conversionElements.push('NEW badge', 'spotlight effect', 'announcement banner')
        if (isFree) conversionElements.push('FREE badge', 'checkmark icons', 'benefit callouts')
        conversionElements.push('directional arrow', 'CTA button/text')

        const promptInput = `
Create a MARKETING poster with these specifications:

BRAND: ${brandKit.companyName}
BRAND INDUSTRY/TYPE: ${brandKit.description || 'General business'}
COLOR PALETTE: ${colorPalette}

PRIMARY MESSAGE: "${message}"
(Extract main headline - keep to 3-5 words maximum for impact)

MARKETING GOAL: ${marketingGoal}
DESIGN STYLE: ${gatheredInfo.visualStyle || 'bold, promotional'}
MOOD: ${gatheredInfo.mood || 'urgent, engaging, conversion-focused'}
FORMAT: ${formatDesc}

CONVERSION ELEMENTS TO INCLUDE: ${conversionElements.join(', ')}
ADDITIONAL ELEMENTS: ${gatheredInfo.keyElements || 'bold typography, clear hierarchy'}

COLOR PSYCHOLOGY STRATEGY: ${colorPsychology}

MARKETING POSTER REQUIREMENTS:
- This is a MARKETING ADVERTISEMENT, not a photograph or art piece
- Create VISUAL HIERARCHY: Headline → Value Prop → CTA
- Keep headline text SHORT (3-5 words) and ACTION-ORIENTED
- Include a CALL-TO-ACTION element (arrow, button, or text like "Shop Now")
- Use HIGH CONTRAST for readability and impact
- Add marketing elements: badges, ribbons, price tags, urgency indicators
- Use graphic design terms ONLY (no "camera", "lighting", "scene")
- Be CONCISE - under 150 words total
- Focus on CONVERSION and ENGAGEMENT

Generate the marketing poster prompt now.
`
        try {
            const prompt = await this.llm.generate(promptInput, {
                systemPrompt: POSTER_PROMPT_ENGINEER_SYSTEM_PROMPT,
                temperature: 0.5, // Balanced for creativity + consistency
                maxTokens: 300 // Limit verbosity
            })

            // Clean up the response - remove any markdown or explanations
            let cleanedPrompt = prompt.trim()
            cleanedPrompt = cleanedPrompt.replace(/^```.*\n/gm, '').replace(/^```$/gm, '') // Remove code blocks
            cleanedPrompt = cleanedPrompt.replace(/^["']|["']$/g, '') // Remove quotes
            cleanedPrompt = cleanedPrompt.split('\n')[0] // Take only first line if multiline

            console.log("Generated marketing prompt:", cleanedPrompt)
            return cleanedPrompt
        } catch (error) {
            console.error("Failed to generate prompt via LLM, falling back to static builder", error)
            return buildPosterPromptEngineeringPrompt(brandKit, gatheredInfo)
        }
    }

    async refinePrompt(
        brandKit: BrandKit,
        history: ConversationTurn[],
        currentInfo: GatheredInfo
    ): Promise<{ isReady: boolean, nextQuestion?: string, refinedPrompt?: string, updatedInfo: GatheredInfo }> {

        const historyText = history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n')

        // Count how many questions we've asked (assistant messages)
        const questionsAsked = history.filter(h => h.role === 'assistant').length

        // Hard limit: After 3 questions, we generate with what we have
        const shouldForceGenerate = questionsAsked >= 3

        // Check if we have minimum required info
        const hasMinimumInfo = currentInfo.dimensions && currentInfo.message

        // Dynamically determine default style based on message content
        const message = currentInfo.message || ""
        const hasDiscount = /\d+%|\boff\b|\bsale\b|\bsave\b/i.test(message)
        const hasUrgency = /\blimited\b|\bnow\b|\btoday\b|\bhurry\b|\bending\b/i.test(message)
        const isLaunch = /\bnew\b|\blaunching\b|\barrival\b|\bintroducing\b/i.test(message)
        const isPremium = /\bluxury\b|\bpremium\b|\bexclusive\b|\belite\b/i.test(message)
        const isFun = /\bfun\b|\bexciting\b|\bamazing\b|\bcelebrate\b/i.test(message)

        // Smart defaults based on marketing intent
        let defaultStyle = "bold, eye-catching, promotional"
        let defaultMood = "energetic, conversion-focused"

        if (isPremium) {
            defaultStyle = "elegant, sophisticated, luxury design"
            defaultMood = "premium, aspirational, refined"
        } else if (hasDiscount || hasUrgency) {
            defaultStyle = "bold, urgent, high-impact"
            defaultMood = "urgent, exciting, action-driven"
        } else if (isLaunch) {
            defaultStyle = "modern, fresh, announcement-style"
            defaultMood = "exciting, innovative, attention-grabbing"
        } else if (isFun) {
            defaultStyle = "vibrant, playful, energetic"
            defaultMood = "fun, engaging, youthful"
        }

        const systemPrompt = `
${POSTER_CLARIFICATION_PROMPT}

Current Gathered Info: ${JSON.stringify(currentInfo)}

Conversation History:
${historyText}

You have asked ${questionsAsked} questions so far.

IMPORTANT RULES:
1. If you have dimensions AND a message/headline, you have ENOUGH information. Mark isReady: true.
2. If the user says "no" or "generate now" or similar, STOP asking questions. Mark isReady: true.
3. Visual style and mood can use smart defaults based on the marketing message.
4. Do NOT ask more than 3 questions total.
5. If you've asked 3 questions already, mark isReady: true regardless.

MINIMUM REQUIRED INFO:
- Dimensions (default to "1024x1024" if not specified)
- Message/Headline (required)

OPTIONAL INFO (use smart defaults if missing):
- Visual Style: Analyze the message to determine appropriate style
  * Sale/Discount → "bold, urgent, high-impact"
  * New/Launch → "modern, fresh, announcement-style"
  * Premium/Luxury → "elegant, sophisticated, luxury design"
  * Fun/Exciting → "vibrant, playful, energetic"
  * Default → "bold, eye-catching, promotional"
- Mood: Match the marketing goal
  * Urgency → "urgent, exciting, action-driven"
  * Premium → "premium, aspirational, refined"
  * Launch → "exciting, innovative, attention-grabbing"
  * Default → "energetic, conversion-focused"
- Key Elements: Always include marketing elements like "bold typography, CTA elements, visual hierarchy"

Return JSON:
{
  "isReady": boolean,
  "nextQuestion": "string" (ONLY if not ready AND haven't asked 3 questions),
  "updatedInfo": {
    "dimensions": "width x height or format",
    "message": "main headline/text",
    "visualStyle": "description",
    "mood": "description",
    "keyElements": "elements to include"
  }
}
`
        const response = await this.llm.generateJson<{ isReady: boolean, nextQuestion?: string, updatedInfo: GatheredInfo }>("Analyze conversation and update info", {
            systemPrompt,
            temperature: 0.2,
        })

        // Force generation if we've asked too many questions or have minimum info
        const isReady = Boolean(shouldForceGenerate || hasMinimumInfo || response.isReady)

        // Fill in defaults with dynamic, marketing-intelligent values
        const updatedInfo = {
            dimensions: response.updatedInfo.dimensions || currentInfo.dimensions || "1024x1024",
            message: response.updatedInfo.message || currentInfo.message || "Special Offer",
            visualStyle: response.updatedInfo.visualStyle || currentInfo.visualStyle || defaultStyle,
            mood: response.updatedInfo.mood || currentInfo.mood || defaultMood,
            keyElements: response.updatedInfo.keyElements || currentInfo.keyElements || "bold typography, CTA elements, visual hierarchy, marketing graphics"
        }

        let refinedPrompt = undefined
        if (isReady) {
            // refinedPrompt = buildPosterPromptEngineeringPrompt(brandKit, updatedInfo)
            console.log("Poster is ready! Generating prompt via LLM...")
            refinedPrompt = await this.generateImagePrompt(brandKit, updatedInfo)
            console.log("Generated prompt:", refinedPrompt)
        }

        return {
            isReady,
            nextQuestion: isReady ? undefined : response.nextQuestion,
            updatedInfo,
            refinedPrompt
        }
    }

    async modifyPrompt(
        brandKit: BrandKit,
        currentPrompt: string,
        currentInfo: GatheredInfo,
        userRequest: string
    ): Promise<{ updatedPrompt: string, updatedInfo: GatheredInfo }> {
        const systemPrompt = `
You are a design modification expert. The user has a generated poster and wants to make changes.

CURRENT DESIGN INFO:
${JSON.stringify(currentInfo, null, 2)}

CURRENT IMAGE GENERATION PROMPT:
${currentPrompt}

USER'S CHANGE REQUEST:
${userRequest}

Analyze the user's request and update the design info accordingly.
Then generate a new image generation prompt that incorporates these changes.

Common requests and how to handle them:
- "Make text bigger/smaller" → adjust typography in keyElements
- "Change color to X" → update visualStyle to mention the color
- "Add/remove element" → update keyElements
- "Make it more/less professional" → update mood
- "Change style" → update visualStyle
- "Add discount/percentage" → update message and keyElements

Return JSON:
{
  "updatedInfo": {
    "dimensions": "string",
    "message": "string",
    "visualStyle": "string",
    "mood": "string",
    "keyElements": "string"
  },
  "explanation": "Brief explanation of what changes you made"
}
`

        const response = await this.llm.generateJson<{
            updatedInfo: GatheredInfo,
            explanation: string
        }>(userRequest, {
            systemPrompt,
            temperature: 0.3,
        })

        // const updatedPrompt = buildPosterPromptEngineeringPrompt(brandKit, response.updatedInfo)
        console.log("Modified prompt based on:", userRequest)
        console.log("Explanation:", response.explanation)

        const updatedPrompt = await this.generateImagePrompt(brandKit, response.updatedInfo)
        console.log("New prompt:", updatedPrompt)

        return {
            updatedPrompt,
            updatedInfo: response.updatedInfo
        }
    }
}
