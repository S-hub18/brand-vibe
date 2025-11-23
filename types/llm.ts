import { ZodSchema } from "zod"

export type LLMProvider = 'GOOGLE' | 'ANTHROPIC' | 'OPENAI'

export interface GenerateOptions {
    temperature?: number
    maxTokens?: number
    systemPrompt?: string
    jsonSchema?: ZodSchema
    stopSequences?: string[]
}

export interface StreamOptions extends GenerateOptions {
    onChunk: (chunk: string) => void
}

export interface LLMResponse {
    content: string
    usage?: TokenUsage
}

export interface TokenUsage {
    promptTokens: number
    completionTokens: number
    totalTokens: number
}

export interface Message {
    role: 'user' | 'model' | 'system'
    content: string
}
