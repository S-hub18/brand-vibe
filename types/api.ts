import { NextRequest } from "next/server"

export interface APIResponse<T> {
    data?: T
    error?: string
    status: number
}

export interface ErrorResponse {
    message: string
    code?: string
    details?: any
}

export interface PaginatedResponse<T> {
    items: T[]
    total: number
    page: number
    limit: number
    hasMore: boolean
}

export interface RequestWithAuth extends NextRequest {
    auth?: {
        userId: string
    }
}
