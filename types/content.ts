import { GeneratedContent as PrismaGeneratedContent } from "@prisma/client"

export interface GeneratedContent extends PrismaGeneratedContent {
    metadata: string | null // Parsed as any
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
