import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/db/database";
import { ensureDemoUser } from "@/lib/auth/demo-user";
import { parseBrandKit } from "@/lib/utils/brand-kit";

export async function GET(req: NextRequest) {
    try {
        const userId = await ensureDemoUser();
        const id = req.nextUrl.pathname.split("/").pop();
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
        const kit = await Database.findBrandKitByIdAndUserId(id, userId);
        if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(parseBrandKit(kit));
    } catch (error) {
        console.error("Brand kit fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch brand kit" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const userId = await ensureDemoUser();
        const id = req.nextUrl.pathname.split("/").pop();
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
        const body = await req.json();

        const updated = await Database.updateBrandKit(id, {
            name: body.name,
            description: body.description,
            companyName: body.companyName,
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
            productImages: body.productImages || [],
        });
        return NextResponse.json(parseBrandKit(updated));
    } catch (error) {
        console.error("Brand kit update error:", error);
        return NextResponse.json({ error: "Failed to update brand kit" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const userId = await ensureDemoUser();
        const id = req.nextUrl.pathname.split("/").pop();
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        // Check if brand kit exists and belongs to user
        const kit = await Database.findBrandKitByIdAndUserId(id, userId);
        if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Delete the brand kit
        await Database.deleteBrandKit(id);

        return NextResponse.json({ success: true, message: "Brand kit deleted successfully" });
    } catch (error) {
        console.error("Brand kit delete error:", error);
        return NextResponse.json({ error: "Failed to delete brand kit" }, { status: 500 });
    }
}

