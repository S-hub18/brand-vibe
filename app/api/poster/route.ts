import { NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/db/database"
import { PosterAgent } from "@/lib/agents/poster-agent"
import { NanoBananaClient } from "@/lib/api-clients/nano-banana"
import { BrandKit } from "@/types/brand"
import { GatheredInfo } from "@/types/poster"
import { parseBrandKit } from "@/lib/utils/brand-kit"

import { ensureDemoUser } from "@/lib/auth/demo-user"

export async function POST(req: NextRequest) {
    // Ensure demo user exists
    const userId = await ensureDemoUser()

    const body = await req.json()
    const { action, sessionId, brandKitId, message } = body

    try {
        const posterAgent = new PosterAgent()
        const nanoBanana = new NanoBananaClient()

        if (action === 'START') {
            const brandKit = await Database.findBrandKitById(brandKitId)
            if (!brandKit) return NextResponse.json({ error: "Brand kit not found" }, { status: 404 })

            const result = await posterAgent.startPosterCreation(parseBrandKit(brandKit), message)

            const posterSession = await Database.createPosterSession({
                userId: userId,
                brandKitId,
                initialDescription: message,
                conversationHistory: [{ role: 'user', content: message, timestamp: Date.now() }],
                gatheredInfo: result.gatheredInfo,
                currentStage: 'GATHERING'
            })

            return NextResponse.json({ session: posterSession, nextQuestions: result.questions })
        }

        if (action === 'REPLY') {
            const posterSession = await Database.findPosterSessionById(sessionId)
            if (!posterSession) return NextResponse.json({ error: "Session not found" }, { status: 404 })

            const brandKit = await Database.findBrandKitById(posterSession.brandKitId)
            if (!brandKit) return NextResponse.json({ error: "Brand kit not found" }, { status: 404 })

            const history = posterSession.conversationHistory || []
            history.push({ role: 'user', content: message, timestamp: Date.now() })

            const result = await posterAgent.refinePrompt(
                parseBrandKit(brandKit),
                history,
                posterSession.gatheredInfo || {}
            )

            if (result.isReady && result.refinedPrompt) {
                // Start generation
                const imageResult = await nanoBanana.generateImage({ prompt: result.refinedPrompt })

                // Initialize imageVersions with the first version
                const firstVersion = {
                    imageUrl: imageResult.output[0],
                    prompt: result.refinedPrompt,
                    timestamp: Date.now()
                }

                await Database.updatePosterSession(sessionId, {
                    conversationHistory: history,
                    gatheredInfo: result.updatedInfo,
                    refinedPrompt: result.refinedPrompt,
                    currentStage: 'COMPLETED',
                    generatedImageUrl: imageResult.output[0],
                    nanoBananaJobId: imageResult.id,
                    imageVersions: [firstVersion], // Store first version
                    completedAt: new Date().toISOString()
                })

                return NextResponse.json({
                    status: 'COMPLETED',
                    imageUrl: imageResult.output[0],
                    refinedPrompt: result.refinedPrompt,
                    versions: [firstVersion] // Return first version to frontend
                })
            } else {
                // Continue gathering
                history.push({ role: 'assistant', content: result.nextQuestion, timestamp: Date.now() })

                await Database.updatePosterSession(sessionId, {
                    conversationHistory: history,
                    gatheredInfo: result.updatedInfo,
                    currentStage: 'GATHERING'
                })

                return NextResponse.json({
                    status: 'GATHERING',
                    nextQuestion: result.nextQuestion
                })
            }
        }

        if (action === 'REFINE') {
            const posterSession = await Database.findPosterSessionById(sessionId)
            if (!posterSession) return NextResponse.json({ error: "Session not found" }, { status: 404 })

            const brandKit = await Database.findBrandKitById(posterSession.brandKitId)
            if (!brandKit) return NextResponse.json({ error: "Brand kit not found" }, { status: 404 })

            if (!posterSession.refinedPrompt) {
                return NextResponse.json({ error: "No existing prompt to refine" }, { status: 400 })
            }

            const history = posterSession.conversationHistory || []
            history.push({ role: 'user', content: message, timestamp: Date.now() })

            // Use the modifyPrompt method to update the prompt based on user feedback
            const result = await posterAgent.modifyPrompt(
                parseBrandKit(brandKit),
                posterSession.refinedPrompt,
                posterSession.gatheredInfo || {},
                message
            )

            // Generate new image with updated prompt
            const imageResult = await nanoBanana.generateImage({ prompt: result.updatedPrompt })

            // Store the new version
            const imageVersions = posterSession.imageVersions || []
            imageVersions.push({
                imageUrl: imageResult.output[0],
                prompt: result.updatedPrompt,
                timestamp: Date.now()
            })

            history.push({
                role: 'assistant',
                content: '✨ Updated your poster with the changes!',
                timestamp: Date.now()
            })

            await Database.updatePosterSession(sessionId, {
                conversationHistory: history,
                gatheredInfo: result.updatedInfo,
                refinedPrompt: result.updatedPrompt,
                currentStage: 'REFINING',
                generatedImageUrl: imageResult.output[0],
                imageVersions: imageVersions
            })

            return NextResponse.json({
                status: 'REFINED',
                imageUrl: imageResult.output[0],
                refinedPrompt: result.updatedPrompt,
                versions: imageVersions
            })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })

    } catch (error) {
        console.error("Poster API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
