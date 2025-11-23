import { NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/db/database"
import { OrchestratorAgent } from "@/lib/agents/orchestrator"
import { TwitterContentAgent } from "@/lib/agents/twitter-agent"
import { InstagramContentAgent } from "@/lib/agents/instagram-agent"
import { LinkedInContentAgent } from "@/lib/agents/linkedin-agent"
import { BrandKit } from "@/types/brand"
import { parseBrandKit } from "@/lib/utils/brand-kit"

import { ensureDemoUser } from "@/lib/auth/demo-user"

export async function POST(req: NextRequest) {
    console.log("=== Generate API Called ===")

    try {
        // Ensure demo user exists
        const userId = await ensureDemoUser()
        console.log("Demo user ID:", userId)

        const body = await req.json()
        console.log("Request body:", JSON.stringify(body, null, 2))

        // Support both legacy and new field names from client
        const {
            brandKitId,
            topic,
            platform,
            request: legacyRequest,
            platformOverride: legacyPlatformOverride,
        } = body as any

        // Map client fields to expected variables
        const request = legacyRequest ?? topic
        const platformOverride = legacyPlatformOverride ?? platform

        if (!brandKitId || !request) {
            console.error("Missing required fields:", { brandKitId, request })
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        console.log("Processing request:", { brandKitId, request, platformOverride })

        const brandKit = await Database.findBrandKitByIdAndUserId(brandKitId, userId)

        if (!brandKit) {
            console.error("Brand kit not found:", { brandKitId, userId })
            return NextResponse.json({ error: "Brand kit not found" }, { status: 404 })
        }

        console.log("Found brand kit:", brandKit.name)

        // Parse JSON fields
        const typedBrandKit = parseBrandKit(brandKit)

        console.log("Starting orchestrator...")
        const orchestrator = new OrchestratorAgent()

        let agentType = platformOverride
        let parameters = {}

        if (!agentType) {
            const routing = await orchestrator.processRequest(request, typedBrandKit)
            console.log("Orchestrator routing response:", JSON.stringify(routing, null, 2))
            agentType = routing.agent
            parameters = routing.parameters
        }

        console.log("Agent type:", agentType)

        let content
        const context = {
            topic: request,
            platformContext: parameters
        }

        console.log(`Generating ${agentType} content...`)

        switch (agentType) {
            case 'TWITTER':
                const twitterAgent = new TwitterContentAgent()
                content = await twitterAgent.generateContent(typedBrandKit, context)
                console.log("Twitter content generated:", content)
                break
            case 'INSTAGRAM':
                const instagramAgent = new InstagramContentAgent()
                content = await instagramAgent.generateContent(typedBrandKit, context)
                console.log("Instagram content generated:", content)
                break
            case 'LINKEDIN':
                const linkedinAgent = new LinkedInContentAgent()
                content = await linkedinAgent.generateContent(typedBrandKit, context)
                console.log("LinkedIn content generated:", content)
                break
            case 'POSTER':
                return NextResponse.json({
                    redirect: `/poster/new?brandKitId=${brandKitId}&description=${encodeURIComponent(request)}`
                })
            case 'ORCHESTRATOR':
                // If orchestrator returns ORCHESTRATOR, default to TWITTER
                console.log("Orchestrator returned ORCHESTRATOR type, defaulting to TWITTER")
                const defaultTwitterAgent = new TwitterContentAgent()
                content = await defaultTwitterAgent.generateContent(typedBrandKit, context)
                agentType = 'TWITTER'
                console.log("Default Twitter content generated:", content)
                break
            default:
                console.error("Unsupported agent type:", agentType)
                return NextResponse.json({ error: `Unsupported agent type: ${agentType}` }, { status: 400 })
        }

        // Save generated content
        console.log("Saving generated content to database...")
        await Database.createGeneratedContent({
            userId: userId,
            brandKitId: brandKitId,
            contentType: 'TEXT',
            platform: agentType,
            content: JSON.stringify(content),
            metadata: parameters
        })

        console.log("Content saved successfully")
        console.log("=== Generation Complete ===")
        return NextResponse.json({ agent: agentType, content })

    } catch (error) {
        console.error("=== Generation Error ===")
        console.error("Error type:", error?.constructor?.name)
        console.error("Error message:", error instanceof Error ? error.message : String(error))
        console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal server error"
        }, { status: 500 })
    }
}
