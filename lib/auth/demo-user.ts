import { Database } from "@/lib/db/database"

export const DEMO_USER_ID = "550e8400-e29b-41d4-a716-446655440000"

export async function ensureDemoUser() {
    try {
        console.log("🔍 Checking for demo user:", DEMO_USER_ID)
        const user = await Database.findUserById(DEMO_USER_ID)
        console.log("👤 Demo user lookup result:", user ? "EXISTS" : "NOT FOUND")

        if (!user) {
            console.log("🆕 Creating demo user...")
            const newUser = await Database.createUser({
                id: DEMO_USER_ID,
                name: "Demo User",
                email: "demo@brandvibe.ai",
                image: "https://github.com/shadcn.png",
                subscriptionTier: "FREE"
            })
            console.log("✅ Demo user created successfully:", newUser.id)
        } else {
            console.log("✅ Demo user already exists")
        }
    } catch (error) {
        console.error("❌ Demo user creation failed:", error)
        // Log more details about the error
        if (error && typeof error === 'object') {
            console.error("Error details:", {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            })
        }
        // Don't rethrow - we still want the app to work
    }

    return DEMO_USER_ID
}
