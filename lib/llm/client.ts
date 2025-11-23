import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from "@google/generative-ai"
import { GenerateOptions, LLMResponse, Message, StreamOptions } from "@/types/llm"
import { getModel } from "@/lib/config/models"

export class LLMClient {
    private genAI: GoogleGenerativeAI
    private model: GenerativeModel
    private modelName: string

    constructor(modelName?: string, apiKey?: string) {
        const key = apiKey || process.env.GOOGLE_API_KEY
        if (!key) {
            throw new Error("GOOGLE_API_KEY is not set")
        }
        this.genAI = new GoogleGenerativeAI(key)
        this.modelName = modelName || getModel('CONTENT_GENERATION')
        this.model = this.genAI.getGenerativeModel({ model: this.modelName })
    }

    async generate(prompt: string, options?: GenerateOptions): Promise<string> {
        const config = this.buildConfig(options)

        let finalPrompt = prompt
        if (options?.systemPrompt) {
            // Gemini 1.5 supports system instructions, but for simplicity/compatibility we can prepend
            // or use the systemInstruction option if using a model that supports it.
            // Flash supports it.
            this.model = this.genAI.getGenerativeModel({
                model: this.modelName,
                systemInstruction: options.systemPrompt
            })
        }

        const result = await this.model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: config,
        })

        const response = result.response
        return response.text()
    }

    async generateJson<T>(prompt: string, options?: GenerateOptions): Promise<T> {
        try {
            console.log("[LLMClient] generateJson called with model:", this.modelName)

            const config = this.buildConfig(options)
            config.responseMimeType = "application/json"

            // Add JSON schema if provided via Zod
            if (options?.jsonSchema) {
                try {
                    // Convert Zod schema to JSON schema format
                    // Note: This is a simplified approach - full implementation would need zodToJsonSchema
                    config.responseSchema = options.jsonSchema as any
                    console.log("[LLMClient] Using JSON schema")
                } catch (e) {
                    console.warn("[LLMClient] Could not set JSON schema:", e)
                }
            }

            // Recreate model with system instruction if provided
            let modelToUse = this.model
            if (options?.systemPrompt) {
                console.log("[LLMClient] Using system prompt")
                modelToUse = this.genAI.getGenerativeModel({
                    model: this.modelName,
                    systemInstruction: options.systemPrompt
                })
            }

            console.log("[LLMClient] Sending request to Google API...")
            const result = await modelToUse.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: config,
            })

            console.log("[LLMClient] Received response from Google API")
            const text = result.response.text()
            console.log("[LLMClient] Response text length:", text.length)

            try {
                const parsed = JSON.parse(text) as T
                console.log("[LLMClient] Successfully parsed JSON response")
                return parsed
            } catch (e) {
                console.error("[LLMClient] Failed to parse JSON response:", text)
                console.error("[LLMClient] Parse error:", e)
                throw new Error("Failed to parse JSON response from LLM")
            }
        } catch (error: any) {
            console.error("[LLMClient] ERROR in generateJson:", error)
            console.error("[LLMClient] Error type:", error?.constructor?.name)
            console.error("[LLMClient] Error message:", error?.message)
            console.error("[LLMClient] Error stack:", error?.stack)

            // Check if it's a JSON mode error
            if (error.message?.includes("JSON mode is not enabled") || error.message?.includes("400 Bad Request")) {
                const errorMsg = `Model ${this.modelName} does not support JSON mode. ` +
                    `Please use a text generation model like gemini-1.5-flash, gemini-1.5-pro, or gemini-2.5-flash-lite. ` +
                    `Do not use image models like gemini-2.5-flash-image.`
                console.error("[LLMClient]", errorMsg)
                throw new Error(errorMsg)
            }
            throw error
        }
    }

    async streamGenerate(prompt: string, options?: StreamOptions): Promise<void> {
        const config = this.buildConfig(options)

        if (options?.systemPrompt) {
            this.model = this.genAI.getGenerativeModel({
                model: this.modelName,
                systemInstruction: options.systemPrompt
            })
        }

        const result = await this.model.generateContentStream({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: config,
        })

        for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            if (options?.onChunk) {
                options.onChunk(chunkText)
            }
        }
    }

    async generateWithHistory(messages: Message[], options?: GenerateOptions): Promise<string> {
        const config = this.buildConfig(options)

        if (options?.systemPrompt) {
            this.model = this.genAI.getGenerativeModel({
                model: this.modelName,
                systemInstruction: options.systemPrompt
            })
        }

        const chat = this.model.startChat({
            history: messages.map(m => ({
                role: m.role === 'model' ? 'model' : 'user', // Gemini uses 'user' and 'model'
                parts: [{ text: m.content }]
            })),
            generationConfig: config,
        })

        // The last message should be sent via sendMessage, not included in history if it's the trigger
        // But here we assume messages includes the latest one? 
        // Usually generateWithHistory implies sending the whole context.
        // Let's assume the last message is the new one.

        const lastMessage = messages[messages.length - 1]
        const history = messages.slice(0, -1).map(m => ({
            role: m.role === 'model' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }))

        const chatSession = this.model.startChat({
            history: history,
            generationConfig: config
        })

        const result = await chatSession.sendMessage(lastMessage.content)
        return result.response.text()
    }

    private buildConfig(options?: GenerateOptions): GenerationConfig {
        return {
            temperature: options?.temperature ?? 0.7,
            maxOutputTokens: options?.maxTokens,
            stopSequences: options?.stopSequences,
        }
    }
}
