export interface PosterSession {
    id: string
    userId: string
    brandKitId: string
    initialDescription?: string
    conversationHistory?: ConversationTurn[]
    gatheredInfo?: GatheredInfo
    currentStage: string
    refinedPrompt?: string
    nanoBananaJobId?: string
    generatedImageUrl?: string
    imageVersions?: any[]
    createdAt: string
    updatedAt: string
    completedAt?: string
}

export interface ConversationTurn {
    role: 'user' | 'assistant'
    content: string
    timestamp: number
}

export interface GatheredInfo {
    dimensions?: string
    message?: string
    targetAudience?: string
    visualStyle?: string
    keyElements?: string
    colorPreference?: string
    mood?: string
    references?: string
    completeness?: number
}

export type PosterStage = 'GATHERING' | 'READY' | 'GENERATING' | 'COMPLETED' | 'REFINING'

export interface NanoBananaRequest {
    prompt: string
    width?: number
    height?: number
    num_inference_steps?: number
}

export interface NanoBananaResponse {
    id: string
    output: string[] // URLs
    status: string
}
