import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import JSZip from "jszip"
import { NanoBananaClient } from "@/lib/api-clients/nano-banana"
import { Database } from "@/lib/db/database"
import { supabaseAdmin } from "@/lib/db/supabase"

// Initialize Gemini Client directly for Multimodal support
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")

// Helper to upload file to Supabase Storage
async function uploadToStorage(file: File, path: string): Promise<string | null> {
    try {
        const buffer = await file.arrayBuffer()
        const { data, error } = await supabaseAdmin.storage
            .from('brand-assets')
            .upload(path, buffer, {
                contentType: file.type,
                upsert: true
            })

        if (error) {
            console.warn("Storage upload failed (bucket may not exist):", error.message)
            // Gracefully degrade - continue without storage
            return null
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('brand-assets')
            .getPublicUrl(path)

        return publicUrl
    } catch (error) {
        console.warn("Upload helper error (continuing without storage):", error)
        return null
    }
}

export async function POST(req: NextRequest) {
    console.log("=== Studio Generate API Called ===")

    try {
        const formData = await req.formData()
        const logoFile = formData.get("logo") as File | null
        const productFile = formData.get("product") as File | null
        const brandKitId = formData.get("brandKitId") as string | null
        const logoUrlParam = formData.get("logoUrl") as string | null

        if ((!logoFile && !logoUrlParam) || !productFile) {
            return NextResponse.json({ error: "Missing logo or product file" }, { status: 400 })
        }

        console.log("Inputs received:", {
            logoFile: logoFile?.name,
            productFile: productFile?.name,
            brandKitId,
            logoUrl: logoUrlParam
        })

        // 1. Handle Logo
        let logoBase64: string
        let logoMimeType: string
        let finalLogoUrl = logoUrlParam

        if (logoFile) {
            const logoBuffer = await logoFile.arrayBuffer()
            logoBase64 = Buffer.from(logoBuffer).toString("base64")
            logoMimeType = logoFile.type

            // Try to upload if brandKitId is present
            if (brandKitId) {
                const path = `${brandKitId}/logo-${Date.now()}-${logoFile.name}`
                const uploadedUrl = await uploadToStorage(logoFile, path)
                if (uploadedUrl) {
                    finalLogoUrl = uploadedUrl
                    // Update Brand Kit
                    await Database.updateBrandKit(brandKitId, { logoUrl: finalLogoUrl })
                    console.log("Updated Brand Kit logo:", finalLogoUrl)
                }
            }
        } else if (logoUrlParam) {
            // Fetch remote logo for Gemini
            const res = await fetch(logoUrlParam)
            const buffer = await res.arrayBuffer()
            logoBase64 = Buffer.from(buffer).toString("base64")
            logoMimeType = res.headers.get("content-type") || "image/png"
        } else {
            throw new Error("No logo provided")
        }

        // 2. Handle Product
        const productBuffer = await productFile.arrayBuffer()
        const productBase64 = Buffer.from(productBuffer).toString("base64")
        const productMimeType = productFile.type

        // Try to upload product image if brandKitId is present
        if (brandKitId) {
            const path = `${brandKitId}/product-${Date.now()}-${productFile.name}`
            const uploadedUrl = await uploadToStorage(productFile, path)
            if (uploadedUrl) {
                // Fetch current brand kit to append image
                const brandKit = await Database.findBrandKitById(brandKitId)
                if (brandKit) {
                    const currentImages = brandKit.productImages || []
                    const newImage = { url: uploadedUrl, label: "Product Image" }
                    await Database.updateBrandKit(brandKitId, {
                        productImages: [...currentImages, newImage]
                    })
                    console.log("Added product image to Brand Kit:", uploadedUrl)
                }
            }
        }

        // Get Brand Kit context if available
        let brandContext = ""
        if (brandKitId) {
            const brandKit = await Database.findBrandKitById(brandKitId)
            if (brandKit) {
                brandContext = `
Brand Information:
- Company: ${brandKit.companyName}
- Description: ${brandKit.description || 'N/A'}
- Tagline: ${brandKit.tagline || 'N/A'}
- Mission: ${brandKit.mission || 'N/A'}
- Tone: ${brandKit.tone || 'Professional'}
- Target Audience: ${brandKit.audienceDescription || 'General public'}
                `.trim()
            }
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite"
        })

        // STEP 1: Analyze the brand and product to understand context
        console.log("Step 1: Analyzing brand and product context...")
        const analysisPrompt = `You are a creative marketing analyst. Analyze the provided brand logo and product image.

${brandContext ? brandContext + '\n' : ''}
Based on the images provided (logo and product), tell me:
1. What type of product is this? (Be specific - describe what you see in the product image)
2. What industry/category does it belong to?
3. What are the key visual features of the product?
4. What brand personality does the logo convey?
5. Who is the likely target audience for this product?
6. What are 3 key selling points or benefits this product likely offers?

Return your analysis as a JSON object with this structure:
{
    "productType": "...",
    "industry": "...",
    "productFeatures": ["...", "...", "..."],
    "brandPersonality": "...",
    "targetAudience": "...",
    "sellingPoints": ["...", "...", "..."]
}`

        const analysisResult = await model.generateContent([
            analysisPrompt,
            {
                inlineData: {
                    data: logoBase64,
                    mimeType: logoMimeType
                }
            },
            {
                inlineData: {
                    data: productBase64,
                    mimeType: productMimeType
                }
            }
        ])

        const analysisText = analysisResult.response.text()
        console.log("Context Analysis Complete")

        let productAnalysis: any = {}
        try {
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
            const jsonStr = jsonMatch ? jsonMatch[0] : analysisText
            productAnalysis = JSON.parse(jsonStr)
        } catch (e) {
            console.warn("Could not parse analysis, continuing with fallback:", e)
            productAnalysis = {
                productType: "product",
                industry: "general",
                productFeatures: [],
                brandPersonality: "professional",
                targetAudience: "consumers",
                sellingPoints: []
            }
        }

        // STEP 2: Generate creative concepts based on the analysis
        console.log("Step 2: Generating contextual creative concepts...")
        const creativePrompt = `You are an expert creative director creating ad campaigns.

BRAND & PRODUCT CONTEXT:
${brandContext ? brandContext + '\n' : ''}
Product Type: ${productAnalysis.productType}
Industry: ${productAnalysis.industry}
Target Audience: ${productAnalysis.targetAudience}
Key Features: ${productAnalysis.productFeatures?.join(', ') || 'N/A'}
Selling Points: ${productAnalysis.sellingPoints?.join(', ') || 'N/A'}

IMAGES PROVIDED:
- Brand Logo (reference the actual logo colors, style, and design elements you see)
- Product Image (reference the actual product you see - its shape, color, packaging, etc.)

Create 5 distinct, highly relevant ad creative concepts for THIS SPECIFIC PRODUCT.
Each concept must:
1. Be directly relevant to what this product actually is and does
2. Appeal to the target audience identified
3. Highlight the actual selling points and features
4. Use the brand's tone and personality
5. Reference visual elements from BOTH the logo and product images

For each concept provide:
1. Headline: Catchy, benefit-driven, specific to this product
2. Body Copy: 1-2 compelling sentences that sell THIS product's unique value
3. Visual Description: Detailed description for AI image generation that:
   - Accurately describes the ACTUAL product shown in the image (shape, color, packaging, details)
   - Incorporates the brand logo naturally into the scene
   - Creates an appealing commercial photography setup
   - Specifies lighting, angle, background, and styling
   - Makes the product the hero of the image

Return as valid JSON:
{
    "concepts": [
        {
            "headline": "...",
            "body": "...",
            "visualDescription": "..."
        }
    ]
}`

        const conceptsResult = await model.generateContent([
            creativePrompt,
            {
                inlineData: {
                    data: logoBase64,
                    mimeType: logoMimeType
                }
            },
            {
                inlineData: {
                    data: productBase64,
                    mimeType: productMimeType
                }
            }
        ])

        const conceptsText = conceptsResult.response.text()
        console.log("Creative Concepts Generated")

        // Parse JSON
        let concepts = []
        try {
            const jsonMatch = conceptsText.match(/\{[\s\S]*\}/)
            const jsonStr = jsonMatch ? jsonMatch[0] : conceptsText
            const parsed = JSON.parse(jsonStr)
            concepts = parsed.concepts
        } catch (e) {
            console.error("Failed to parse JSON from Gemini:", e)
            console.error("Response was:", conceptsText)
            return NextResponse.json({ error: "Failed to generate concepts" }, { status: 500 })
        }

        if (!concepts || concepts.length === 0) {
            return NextResponse.json({ error: "No concepts generated" }, { status: 500 })
        }

        // Step 2: Generate Images using NanoBananaClient (Gemini Image Gen)
        console.log(`Step 2: Generating images for ${concepts.length} concepts...`)
        const nanoBanana = new NanoBananaClient()
        const zip = new JSZip()

        // Create a text file for captions
        let captionsText = "AI Creative Studio - Campaign Assets\n====================================\n\n"

        // Store results for preview
        const previewResults: Array<{
            headline: string
            body: string
            imageUrl: string
            visualDescription: string
        }> = []

        // Process concepts
        for (let i = 0; i < concepts.length; i++) {
            const concept = concepts[i]
            console.log(`Generating image for concept ${i + 1}...`)

            try {
                const imagePrompt = `${concept.visualDescription}, professional product photography, 8k resolution, highly detailed, commercial lighting`

                const imageResult = await nanoBanana.generateImage({ prompt: imagePrompt })

                if (imageResult.status === "succeeded" && imageResult.output && imageResult.output.length > 0) {
                    const imageUrl = imageResult.output[0]

                    // Fetch the image data
                    let imageData: ArrayBuffer | Buffer
                    if (imageUrl.startsWith("data:")) {
                        const base64Data = imageUrl.split(",")[1]
                        imageData = Buffer.from(base64Data, "base64")
                    } else {
                        const imgRes = await fetch(imageUrl)
                        imageData = await imgRes.arrayBuffer()
                    }

                    zip.file(`creative_${i + 1}.png`, imageData)

                    captionsText += `Creative #${i + 1}\n`
                    captionsText += `Headline: ${concept.headline}\n`
                    captionsText += `Body: ${concept.body}\n`
                    captionsText += `Visual Prompt: ${concept.visualDescription}\n`
                    captionsText += "------------------------------------\n\n"

                    // Store for preview
                    previewResults.push({
                        headline: concept.headline,
                        body: concept.body,
                        imageUrl: imageUrl,
                        visualDescription: concept.visualDescription
                    })
                }
            } catch (err) {
                console.error(`Failed to generate image for concept ${i + 1}:`, err)
            }
        }

        zip.file("captions.txt", captionsText)

        // Step 3: Generate Zip
        console.log("Step 3: Finalizing Zip package...")
        const zipContent = await zip.generateAsync({ type: "base64" })

        // Return JSON with both preview data and zip file
        return NextResponse.json({
            success: true,
            creatives: previewResults,
            zipFile: zipContent,
            zipFileName: "creative-suite.zip"
        })

    } catch (error) {
        console.error("Studio API Error:", error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal server error"
        }, { status: 500 })
    }
}
