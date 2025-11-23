import { BrandKit as SupabaseBrandKit } from "@/lib/db/database"
import { BrandKit } from "@/types/brand"

/**
 * Converts a Supabase BrandKit to a properly typed BrandKit
 * Supabase already returns native JSON objects, so no parsing needed
 */
export function parseBrandKit(supabaseBrandKit: SupabaseBrandKit): BrandKit {
    return {
        ...supabaseBrandKit,
        values: supabaseBrandKit.values || [],
        colors: supabaseBrandKit.colors || {},
        typography: supabaseBrandKit.typography || {},
        products: supabaseBrandKit.products || [],
        productImages: supabaseBrandKit.productImages || [],
    }
}
