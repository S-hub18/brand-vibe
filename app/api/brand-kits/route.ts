import { NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/db/database"
import { ensureDemoUser } from "@/lib/auth/demo-user"
import { parseBrandKit } from "@/lib/utils/brand-kit"

export async function GET(req: NextRequest) {
    try {
        // Ensure demo user exists
        const userId = await ensureDemoUser()

        const brandKits = await Database.findBrandKitsByUserId(userId, { orderBy: 'updatedAt' })

        // Parse JSON fields (though Supabase already returns native JSON)
        const parsedBrandKits = brandKits.map(parseBrandKit)

        return NextResponse.json(parsedBrandKits)
    } catch (error) {
        console.error("Brand kits fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch brand kits" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        // Ensure demo user exists
        const userId = await ensureDemoUser()

        const body = await req.json()

        const brandKit = await Database.createBrandKit({
            userId: userId,
            name: body.name,
            companyName: body.companyName,
            description: body.description,
            tagline: body.tagline,
            vision: body.vision,
            mission: body.mission,
            values: body.values || [],
            colors: body.colors || {},
            typography: body.typography || {},
            tone: body.tone,
            voiceDescriptor: body.voiceDescriptor,
            audienceDescription: body.audienceDescription,
            products: body.products || [],
            logoUrl: body.logoUrl,
            brandGuidelinesUrl: body.brandGuidelinesUrl,
            productImages: body.productImages || []
        })

        // Parse JSON fields before returning
        return NextResponse.json(parseBrandKit(brandKit))
    } catch (error) {
        console.error("Brand kit creation error:", error)
        return NextResponse.json({ error: "Failed to create brand kit" }, { status: 500 })
    }
}
