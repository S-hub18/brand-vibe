"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Copy, Check, RefreshCw } from "lucide-react"

interface BrandKit {
    id: string
    name: string
    companyName: string
}

export default function GeneratePage() {
    const [brandKits, setBrandKits] = useState<BrandKit[]>([])
    const [loading, setLoading] = useState(false)
    const [generatedContent, setGeneratedContent] = useState<any>(null)
    const [copied, setCopied] = useState(false)
    const { register, handleSubmit, watch } = useForm()

    useEffect(() => {
        // Fetch brand kits
        fetch("/api/brand-kits")
            .then(res => res.json())
            .then(data => setBrandKits(data))
            .catch(err => console.error("Failed to fetch brand kits", err))
    }, [])

    const onSubmit = async (data: any) => {
        setLoading(true)
        setGeneratedContent(null)
        try {
            console.log("Sending request to /api/generate with data:", data)
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })

            console.log("Response status:", res.status)
            if (res.ok) {
                const result = await res.json()
                console.log("Received result from API:", result)
                console.log("Content type:", typeof result.content)
                console.log("Content value:", result.content)
                setGeneratedContent(result)
                console.log("State updated with generated content")
            } else {
                const errorData = await res.json()
                console.error("API returned error:", errorData)
            }
        } catch (error) {
            console.error("Generation failed", error)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Helper to format content for display and copying
    const getFormattedContent = () => {
        if (!generatedContent?.content) return ""

        const content = generatedContent.content

        // If it's an array (LinkedIn, Instagram), format it
        if (Array.isArray(content)) {
            return content.map((item: any) => {
                // Instagram uses 'caption', LinkedIn uses 'content'
                let text = item.content || item.caption || ""
                if (item.hashtags && Array.isArray(item.hashtags)) {
                    text += "\n\n" + item.hashtags.join(" ")
                }
                return text
            }).join("\n\n---\n\n")
        }

        // If it's a simple string (Twitter)
        return content
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-[#3d405b] tracking-tight">Content Generator</h1>
                <p className="text-[#3d405b]/70 text-base">
                    Create engaging social media posts tailored to your brand voice.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card className="border-[#81b29a]/30 bg-white h-full animate-fade-in" style={{ animationDelay: '100ms' }}>
                        <CardHeader className="space-y-2">
                            <CardTitle className="text-lg font-semibold text-[#3d405b]">Configuration</CardTitle>
                            <CardDescription className="text-sm text-[#3d405b]/70">Setup your content request</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-[#3d405b]">Select Brand Kit</label>
                                    <select
                                        {...register("brandKitId", { required: true })}
                                        className="flex h-11 w-full rounded-lg border border-[#81b29a]/30 bg-background px-4 py-2 text-sm"
                                    >
                                        <option value="">Select a brand...</option>
                                        {brandKits.map(kit => (
                                            <option key={kit.id} value={kit.id}>{kit.name} ({kit.companyName})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-[#3d405b]">Topic / Context</label>
                                    <textarea
                                        {...register("topic", { required: true })}
                                        className="flex min-h-[120px] w-full rounded-lg border border-[#81b29a]/30 bg-background px-4 py-2 text-sm resize-none"
                                        placeholder="e.g. Launching our new summer collection next week..."
                                    />
                                    <p className="text-xs text-[#3d405b]/60 mt-1.5">
                                        💡 Our AI will automatically detect the best platform for your content
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-[#3d405b]">Tone Override (Optional)</label>
                                    <input
                                        {...register("tone")}
                                        className="flex h-11 w-full rounded-lg border border-[#81b29a]/30 bg-background px-4 py-2 text-sm"
                                        placeholder="e.g. More excited than usual"
                                    />
                                </div>

                                <Button type="submit" className="w-full h-11 text-white bg-[#e07a5f] hover:bg-[#e07a5f]/90" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Generate Content
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">


                    {generatedContent ? (
                        <Card className="h-full border-[#81b29a]/30 bg-white animate-fade-in" style={{ animationDelay: '200ms' }}>
                            <CardHeader className="space-y-2">
                                <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#3d405b]">
                                    <div className="flex items-center gap-3">
                                        <span>Generated Content</span>
                                        {generatedContent.agent && (
                                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#e07a5f]/10 text-[#e07a5f]">
                                                {generatedContent.agent}
                                            </span>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(getFormattedContent())} className="h-9 w-9">
                                        {copied ? <Check className="h-4 w-4 text-[#81b29a]" /> : <Copy className="h-4 w-4 text-[#3d405b]/70" />}
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-slate max-w-none whitespace-pre-wrap p-6 bg-white rounded-lg border border-[#81b29a]/30 shadow-sm min-h-[200px]">
                                    {Array.isArray(generatedContent.content) ? (
                                        <>
                                            {generatedContent.content.map((item: any, idx: number) => {
                                                // Handle string arrays (Twitter)
                                                if (typeof item === 'string') {
                                                    return (
                                                        <div key={idx} className="mb-6 last:mb-0">
                                                            <p className="text-[#3d405b] leading-relaxed">{item}</p>
                                                        </div>
                                                    );
                                                }

                                                // Handle object arrays (LinkedIn, Instagram)
                                                const mainText = item.content || item.caption || item.text || "";
                                                return (
                                                    <div key={idx} className="mb-6 last:mb-0">
                                                        {mainText && (
                                                            <p className="text-[#3d405b] mb-3 leading-relaxed">{mainText}</p>
                                                        )}
                                                        {item.visualDescription && (
                                                            <div className="mt-3 p-3 bg-[#f4f1de]/30 rounded-lg border border-[#81b29a]/20">
                                                                <p className="text-xs font-medium text-[#3d405b]/70 mb-1">📷 Visual Suggestion:</p>
                                                                <p className="text-sm text-[#3d405b]/80 italic">{item.visualDescription}</p>
                                                            </div>
                                                        )}
                                                        {item.hashtags && Array.isArray(item.hashtags) && item.hashtags.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-3">
                                                                {item.hashtags.map((tag: string, tagIdx: number) => (
                                                                    <span
                                                                        key={tagIdx}
                                                                        className="px-3 py-1 bg-[#81b29a]/10 text-[#81b29a] text-sm rounded-full font-medium"
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {!mainText && !item.visualDescription && !item.hashtags && (
                                                            <p className="text-gray-400 italic text-sm">No content in this variant</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </>
                                    ) : typeof generatedContent.content === 'string' ? (
                                        <p className="text-[#3d405b] leading-relaxed">{generatedContent.content}</p>
                                    ) : (
                                        <div className="text-gray-400 italic text-sm">
                                            <p>Unexpected content format</p>
                                            <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(generatedContent.content, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                                {generatedContent.metadata && (
                                    <div className="mt-4 text-xs text-[#3d405b]/60">
                                        <p>Generated using {generatedContent.metadata.model}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-[#3d405b]/40 border-2 border-dashed border-[#81b29a]/30 rounded-xl p-12">
                            <PenTool className="h-12 w-12 mb-4 opacity-20" />
                            <p className="text-sm">Select a brand kit and topic to generate content.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function PenTool({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 19 7-7 3 3-7 7-3-3z" />
            <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="m2 2 7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
        </svg>
    )
}
