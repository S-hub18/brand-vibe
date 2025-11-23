export interface GeneratedContent {
    id: string
    userId: string
    brandKitId: string
    contentType: string
    platform: string
    content?: string
    imageUrl?: string
    metadata?: any
    createdAt: string
}

export interface ContentContext {
    topic?: string
    audience?: string
    goal?: string
    toneOverride?: string
    platformContext?: any
}

export type PlatformType = 'TWITTER' | 'INSTAGRAM' | 'LINKEDIN' | 'POSTER'

export interface ContentRequest {
    brandKitId: string
    platform: PlatformType
    context: ContentContext
    count?: number
}

export interface ContentResponse {
    content: string[]
    metadata?: any
}
