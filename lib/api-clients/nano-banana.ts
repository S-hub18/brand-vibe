import { GoogleGenerativeAI } from "@google/generative-ai"
import { NanoBananaRequest, NanoBananaResponse } from "@/types/poster"

export class NanoBananaClient {
    private genAI: GoogleGenerativeAI

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")
    }

    async generateImage(request: NanoBananaRequest): Promise<NanoBananaResponse> {
        if (!process.env.GOOGLE_API_KEY) {
            console.warn("GOOGLE_API_KEY not set, returning placeholder")
            return {
                id: "mock-job-id",
                status: "succeeded",
                output: ["https://placehold.co/1024x1024/png?text=Mock+Image+Generation"]
            }
        }

        try {
            console.log("Generating image with prompt:", request.prompt)

            const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" })

            // Generate the image
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: request.prompt }] }]
            })

            console.log("Image generation result:", result)

            // Check if response contains image data
            const response = result.response

            // Try to get the image from the response
            // The API might return the image in different formats
            let imageData = null

            // Check if there's an image in the response parts
            if (response.candidates && response.candidates[0]?.content?.parts) {
                const parts = response.candidates[0].content.parts

                for (const part of parts) {
                    // Check for inline data (base64)
                    if (part.inlineData && part.inlineData.data) {
                        imageData = part.inlineData.data
                        const mimeType = part.inlineData.mimeType || "image/png"

                        console.log("Found base64 image data, length:", imageData.length)

                        // Convert base64 to data URL
                        const dataUrl = `data:${mimeType};base64,${imageData}`

                        return {
                            id: `genai-${Date.now()}`,
                            status: "succeeded",
                            output: [dataUrl]
                        }
                    }

                    // Check if there's text that might be a URL
                    if (part.text && part.text.startsWith("http")) {
                        return {
                            id: `genai-${Date.now()}`,
                            status: "succeeded",
                            output: [part.text.trim()]
                        }
                    }
                }
            }

            // If we get here, try getting text response as fallback
            const text = response.text()
            console.log("Response text:", text)

            // Fallback: return placeholder
            console.warn("No image data found in response, using placeholder")
            return {
                id: `genai-${Date.now()}`,
                status: "succeeded",
                output: ["https://placehold.co/1024x1024/667/fff?text=Image+Generated+(Base64+not+found)"]
            }

        } catch (error: any) {
            console.error("GenAI Image Generation Error:", error)
            console.error("Error details:", error.message, error.stack)

            return {
                id: "error-job-id",
                status: "failed",
                output: [`https://placehold.co/1024x1024/e74c3c/fff?text=Generation+Failed:+${encodeURIComponent(error.message || "Unknown error")}`]
            }
        }
    }

    async getJobStatus(jobId: string): Promise<NanoBananaResponse> {
        return {
            id: jobId,
            status: "succeeded",
            output: ["https://placehold.co/1024x1024/png?text=Status+Check"]
        }
    }
}
