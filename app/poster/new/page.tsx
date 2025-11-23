"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BrandKit } from "@/types/brand"
import { Send, Image as ImageIcon, Loader2, Sparkles } from "lucide-react"

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: number
}

interface ImageVersion {
    imageUrl: string
    prompt: string
    timestamp: number
}

function PosterContent() {
    const searchParams = useSearchParams()
    const initialBrandKitId = searchParams.get("brandKitId")
    const initialDescription = searchParams.get("description")

    const [brandKits, setBrandKits] = useState<BrandKit[]>([])
    const [selectedBrandKitId, setSelectedBrandKitId] = useState(initialBrandKitId || "")
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState(initialDescription || "")
    const [loading, setLoading] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [refinedPrompt, setRefinedPrompt] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [imageVersions, setImageVersions] = useState<ImageVersion[]>([])

    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetch("/api/brand-kits")
            .then(res => res.json())
            .then(data => {
                setBrandKits(data)
                if (!selectedBrandKitId && data.length > 0) {
                    setSelectedBrandKitId(data[0].id)
                }
            })
    }, [selectedBrandKitId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleStart = async () => {
        if (!selectedBrandKitId || !input) return

        setLoading(true)
        setError(null)
        try {
            const res = await fetch("/api/poster", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: 'START',
                    brandKitId: selectedBrandKitId,
                    message: input
                })
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
                throw new Error(errorData.error || `HTTP ${res.status}`)
            }

            const data = await res.json()

            setSessionId(data.session.id)
            setMessages([
                { role: 'user', content: input, timestamp: Date.now() },
                ...data.nextQuestions.map((q: string) => ({ role: 'assistant', content: q, timestamp: Date.now() }))
            ])
            setInput("")
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to start poster session")
        } finally {
            setLoading(false)
        }
    }

    const handleReply = async () => {
        if (!sessionId || !input) return

        const userMsg = input
        setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: Date.now() }])
        setInput("")
        setLoading(true)
        setError(null)

        try {
            const action = generatedImage ? 'REFINE' : 'REPLY'

            const res = await fetch("/api/poster", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    sessionId,
                    message: userMsg
                })
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
                throw new Error(errorData.error || `HTTP ${res.status}`)
            }

            const data = await res.json()

            if (data.status === 'COMPLETED') {
                setGeneratedImage(data.imageUrl)
                setRefinedPrompt(data.refinedPrompt)
                // Initialize versions array with first version
                if (data.versions) {
                    setImageVersions(data.versions)
                }
                setMessages(prev => [...prev, { role: 'assistant', content: "✨ Your poster is ready!", timestamp: Date.now() }])
            } else if (data.status === 'REFINED') {
                setGeneratedImage(data.imageUrl)
                setRefinedPrompt(data.refinedPrompt)
                // Update versions array with all versions including new one
                if (data.versions) {
                    setImageVersions(data.versions)
                }
                setMessages(prev => [...prev, { role: 'assistant', content: "✨ Updated your poster!", timestamp: Date.now() }])
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: data.nextQuestion, timestamp: Date.now() }])
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to process reply")
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error instanceof Error ? error.message : "Failed"}`, timestamp: Date.now() }])
        } finally {
            setLoading(false)
        }
    }

    const handleForceGenerate = async () => {
        if (!sessionId) return

        const userMsg = "Generate poster now with what we have"
        setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: Date.now() }])
        setLoading(true)
        setError(null)

        try {
            const res = await fetch("/api/poster", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: 'REPLY',
                    sessionId,
                    message: userMsg
                })
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
                throw new Error(errorData.error || `HTTP ${res.status}`)
            }

            const data = await res.json()

            if (data.status === 'COMPLETED') {
                setGeneratedImage(data.imageUrl)
                setRefinedPrompt(data.refinedPrompt)
                // Initialize versions array with first version
                if (data.versions) {
                    setImageVersions(data.versions)
                }
                setMessages(prev => [...prev, { role: 'assistant', content: "✨ Your poster is ready!", timestamp: Date.now() }])
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: data.nextQuestion, timestamp: Date.now() }])
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to generate")
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error instanceof Error ? error.message : "Failed"}`, timestamp: Date.now() }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)]">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold text-[#3d405b] tracking-tight">Poster Studio</h1>
                <p className="text-[#3d405b]/70 text-base">
                    Collaborate with AI to design the perfect visual asset
                </p>
            </div>

            {!sessionId ? (
                <div className="flex-1 flex items-center justify-center py-8">
                    <div className="w-full max-w-lg space-y-6 p-6 md:p-8 border border-[#81b29a]/30 rounded-xl bg-white shadow-premium-lg">
                        <div className="flex items-center justify-center">
                            <div className="rounded-full bg-[#e07a5f]/10 p-6">
                                <ImageIcon className="h-10 w-10 text-[#e07a5f]" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#3d405b]">Brand Kit</label>
                            <select
                                className="flex h-11 w-full rounded-lg border border-[#81b29a]/30 bg-background px-4 py-2 text-sm"
                                value={selectedBrandKitId}
                                onChange={(e) => setSelectedBrandKitId(e.target.value)}
                            >
                                <option value="" disabled>Select a brand kit...</option>
                                {brandKits.map(kit => (
                                    <option key={kit.id} value={kit.id}>{kit.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#3d405b]">Describe your poster idea</label>
                            <textarea
                                className="flex min-h-[120px] w-full rounded-lg border border-[#81b29a]/30 bg-background px-4 py-3 text-sm resize-none"
                                placeholder="e.g., A bold banner for our 50% off summer sale..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full h-11 bg-[#e07a5f] text-white hover:bg-[#e07a5f]/90"
                            onClick={handleStart}
                            disabled={loading || !selectedBrandKitId || !input}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Start Designing
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Chat Section */}
                    <div className={`${generatedImage ? 'w-1/2' : 'flex-1'} flex flex-col border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm transition-all`}>
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900">Conversation</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Design your poster through conversation</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        {msg.role === 'assistant' ? (
                                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-medium">
                                                AI
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium">
                                                U
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Bubble */}
                                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
                                        <div className={`max-w-[85%] rounded-lg px-4 py-3 ${msg.role === 'user'
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-white text-gray-900 border border-gray-200'
                                            }`}>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-medium">
                                        AI
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-white space-y-3">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            )}
                            {!generatedImage && messages.length > 2 && (
                                <Button
                                    className="w-full h-11 bg-gray-900 text-white hover:bg-gray-800 transition-colors font-medium"
                                    onClick={handleForceGenerate}
                                    disabled={loading}
                                >
                                    Generate Poster Now
                                </Button>
                            )}
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleReply(); }}
                                className="flex gap-2"
                            >
                                <input
                                    className="flex-1 h-11 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all placeholder:text-gray-400"
                                    placeholder={generatedImage ? "Request changes (e.g., 'make text bigger')..." : "Type your message..."}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={loading}
                                />
                                <Button
                                    type="submit"
                                    disabled={loading || !input}
                                    className="h-11 px-6 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    Send
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Preview Section */}
                    {generatedImage && (
                        <div className="w-1/2 border border-gray-200 rounded-xl bg-white p-6 flex flex-col gap-6 shadow-sm overflow-y-auto">
                            {/* Header */}
                            <div className="pb-4 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900 text-lg">Generated Poster</h3>
                                {imageVersions.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {imageVersions.length} version{imageVersions.length > 1 ? 's' : ''} available
                                    </p>
                                )}
                            </div>

                            {/* Main Poster Display */}
                            <div className="relative">
                                <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200">
                                    <img
                                        src={generatedImage}
                                        alt="Generated Poster"
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                            </div>

                            {/* Prompt Display */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Prompt</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{refinedPrompt}</p>
                            </div>

                            {/* Version History */}
                            {imageVersions.length > 1 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-gray-700">All Versions</h4>

                                    <div className="grid grid-cols-4 gap-2">
                                        {imageVersions.map((version, idx) => {
                                            const isCurrentVersion = version.imageUrl === generatedImage
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        setGeneratedImage(version.imageUrl)
                                                        setRefinedPrompt(version.prompt)
                                                    }}
                                                    className={`relative aspect-square rounded-lg overflow-hidden transition-all ${isCurrentVersion
                                                            ? 'ring-2 ring-gray-900 ring-offset-2'
                                                            : 'ring-1 ring-gray-200 hover:ring-2 hover:ring-gray-400'
                                                        }`}
                                                    title={`Version ${idx + 1}${isCurrentVersion ? ' (Current)' : ''}`}
                                                >
                                                    <img
                                                        src={version.imageUrl}
                                                        alt={`Version ${idx + 1}`}
                                                        className="object-cover w-full h-full"
                                                    />

                                                    {/* Version Number */}
                                                    <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${isCurrentVersion
                                                            ? 'bg-gray-900 text-white'
                                                            : 'bg-white/90 text-gray-700'
                                                        }`}>
                                                        {idx + 1}
                                                    </div>

                                                    {/* Hover Overlay */}
                                                    {!isCurrentVersion && (
                                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors"></div>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <p className="text-xs text-gray-500 text-center">
                                        Click any version to view
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-3 pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-600 text-center">
                                    Continue chatting to refine your poster
                                </p>

                                <Button
                                    className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors font-medium border border-gray-200"
                                    onClick={() => {
                                        setSessionId(null)
                                        setGeneratedImage(null)
                                        setMessages([])
                                        setInput("")
                                        setImageVersions([])
                                        setRefinedPrompt(null)
                                    }}
                                >
                                    Start New Project
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function PosterPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <Sparkles className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <PosterContent />
        </Suspense>
    )
}
