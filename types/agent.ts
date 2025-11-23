export type AgentType = 'ORCHESTRATOR' | 'TWITTER' | 'INSTAGRAM' | 'LINKEDIN' | 'POSTER'

export interface OrchestratorResponse {
    agent: AgentType
    parameters: any
    confidence: number
    clarificationNeeded: boolean
    clarificationQuestions?: string[]
}

export interface AgentContext {
    brandKitId: string
    userId: string
    sessionId?: string
}

export interface RoutingDecision {
    targetAgent: AgentType
    reasoning: string
    confidence: number
}
