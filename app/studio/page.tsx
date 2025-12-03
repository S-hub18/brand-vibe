"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Upload, Loader2, Download, Sparkles, Image as ImageIcon, FileImage, Check } from "lucide-react"
import { BrandKit } from "@/types/brand"

interface Creative {
    headline: string
    body: string
    imageUrl: string
    visualDescription: string
}

export default function StudioPage() {
    const [brandKits, setBrandKits] = useState<BrandKit[]>([])
    const [selectedBrandKitId, setSelectedBrandKitId] = useState<string>("")
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [productFile, setProductFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<string>("")
    const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null)
    const [creatives, setCreatives] = useState<Creative[]>([])
    const [zipFile, setZipFile] = useState<string | null>(null)

    useEffect(() => {
        fetch("/api/brand-kits")
            .then(res => res.json())
            .then(data => {
                setBrandKits(data)
            })
            .catch(err => console.error("Failed to fetch brand kits", err))
    }, [])

    useEffect(() => {
        if (selectedBrandKitId) {
            const kit = brandKits.find(k => k.id === selectedBrandKitId)
            if (kit && kit.logoUrl) {
                setExistingLogoUrl(kit.logoUrl)
                setLogoFile(null)
            } else {
                setExistingLogoUrl(null)
            }
        } else {
            setExistingLogoUrl(null)
        }
    }, [selectedBrandKitId, brandKits])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'product') => {
        if (e.target.files && e.target.files[0]) {
            if (type === 'logo') {
                setLogoFile(e.target.files[0])
                setExistingLogoUrl(null)
            }
            else setProductFile(e.target.files[0])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if ((!logoFile && !existingLogoUrl) || !productFile) return

        setLoading(true)
        setCreatives([])
        setZipFile(null)
        setStatus("Initializing AI Studio...")

        const formData = new FormData()
        if (logoFile) formData.append("logo", logoFile)
        if (productFile) formData.append("product", productFile)
        if (selectedBrandKitId) formData.append("brandKitId", selectedBrandKitId)
        if (existingLogoUrl) formData.append("logoUrl", existingLogoUrl)

        try {
            setStatus("Analyzing brand and product context...")
            const response = await fetch("/api/studio/generate", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Generation failed")
            }

            const data = await response.json()

            setCreatives(data.creatives || [])
            setZipFile(data.zipFile)
            setStatus("Complete!")
        } catch (error) {
            console.error("Error:", error)
            setStatus("Error: " + (error instanceof Error ? error.message : "Unknown error"))
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadZip = () => {
        if (!zipFile) return
        const blob = new Blob([Uint8Array.from(atob(zipFile), c => c.charCodeAt(0))], { type: 'application/zip' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'creative-suite.zip'
        a.click()
        window.URL.revokeObjectURL(url)
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 py-8">
            <div className="space-y-2 text-center">
                <h1 className="text-4xl font-bold text-[#3d405b] tracking-tight">AI Creative Studio</h1>
                <p className="text-[#3d405b]/70 text-lg max-w-2xl mx-auto">
                    Upload your brand assets and let our Auto-Creative Engine generate high-performance ad variations in seconds.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Section */}
                <Card className="border-[#81b29a]/30 bg-white shadow-lg lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-[#3d405b]">Configuration</CardTitle>
                        <CardDescription>Select a brand kit or upload new assets.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#3d405b]">Brand Kit (Optional)</label>
                                    <select
                                        className="flex h-11 w-full rounded-lg border border-[#81b29a]/30 bg-background px-4 py-2 text-sm"
                                        value={selectedBrandKitId}
                                        onChange={(e) => setSelectedBrandKitId(e.target.value)}
                                    >
                                        <option value="">Select a brand kit...</option>
                                        {brandKits.map(kit => (
                                            <option key={kit.id} value={kit.id}>{kit.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#3d405b]">Brand Logo</label>
                                    <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors ${logoFile || existingLogoUrl ? 'border-[#81b29a] bg-[#81b29a]/5' : 'border-gray-200 hover:border-[#81b29a]/50'}`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'logo')}
                                            className="hidden"
                                            id="logo-upload"
                                        />
                                        <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center w-full">
                                            {logoFile ? (
                                                <>
                                                    <div className="h-12 w-12 rounded-full bg-[#81b29a]/20 flex items-center justify-center mb-2">
                                                        <FileImage className="h-6 w-6 text-[#81b29a]" />
                                                    </div>
                                                    <span className="text-sm font-medium text-[#3d405b] truncate max-w-[200px]">{logoFile.name}</span>
                                                    <span className="text-xs text-[#3d405b]/60">Click to change</span>
                                                </>
                                            ) : existingLogoUrl ? (
                                                <>
                                                    <div className="h-12 w-12 rounded-full bg-[#81b29a]/20 flex items-center justify-center mb-2 overflow-hidden">
                                                        <img src={existingLogoUrl} alt="Brand Logo" className="h-full w-full object-cover" />
                                                    </div>
                                                    <span className="text-sm font-medium text-[#3d405b]">Using Brand Kit Logo</span>
                                                    <span className="text-xs text-[#3d405b]/60">Click to upload different logo</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                                        <Upload className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-[#3d405b]">Upload Logo</span>
                                                    <span className="text-xs text-[#3d405b]/60">PNG or JPG recommended</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#3d405b]">Product Image</label>
                                    <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors ${productFile ? 'border-[#e07a5f] bg-[#e07a5f]/5' : 'border-gray-200 hover:border-[#e07a5f]/50'}`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'product')}
                                            className="hidden"
                                            id="product-upload"
                                        />
                                        <label htmlFor="product-upload" className="cursor-pointer flex flex-col items-center w-full">
                                            {productFile ? (
                                                <>
                                                    <div className="h-12 w-12 rounded-full bg-[#e07a5f]/20 flex items-center justify-center mb-2">
                                                        <ImageIcon className="h-6 w-6 text-[#e07a5f]" />
                                                    </div>
                                                    <span className="text-sm font-medium text-[#3d405b] truncate max-w-[200px]">{productFile.name}</span>
                                                    <span className="text-xs text-[#3d405b]/60">Click to change</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                                        <Upload className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-[#3d405b]">Upload Product</span>
                                                    <span className="text-xs text-[#3d405b]/60">High quality photo</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg bg-[#3d405b] hover:bg-[#3d405b]/90 text-white transition-all shadow-md hover:shadow-lg"
                                disabled={loading || ((!logoFile && !existingLogoUrl) || !productFile)}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {status || "Generating..."}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Generate Creative Suite
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Results Section */}
                <div className="lg:col-span-2 space-y-6">
                    {creatives.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#3d405b]">Generated Creatives</h2>
                                    <p className="text-[#3d405b]/70">Preview your AI-generated ad concepts</p>
                                </div>
                                <Button
                                    onClick={handleDownloadZip}
                                    className="bg-[#e07a5f] hover:bg-[#e07a5f]/90 text-white"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download All (Zip)
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {creatives.map((creative, idx) => (
                                    <Card key={idx} className="border-[#81b29a]/30 bg-white shadow-lg overflow-hidden">
                                        <div className="grid md:grid-cols-2 gap-6 p-6">
                                            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                                <img
                                                    src={creative.imageUrl}
                                                    alt={creative.headline}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="text-xs font-medium text-[#81b29a] mb-2">Creative #{idx + 1}</div>
                                                    <h3 className="text-2xl font-bold text-[#3d405b] mb-3">{creative.headline}</h3>
                                                    <p className="text-[#3d405b]/80 leading-relaxed">{creative.body}</p>
                                                </div>
                                                <div className="pt-4 border-t border-gray-200">
                                                    <p className="text-xs font-medium text-[#3d405b]/60 mb-2">Visual Description</p>
                                                    <p className="text-sm text-[#3d405b]/70 leading-relaxed">{creative.visualDescription}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </>
                    ) : loading ? (
                        <Card className="border-[#81b29a]/30 bg-white shadow-lg h-full">
                            <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
                                <div className="text-center space-y-6">
                                    <div className="relative h-24 w-24 mx-auto">
                                        <div className="absolute inset-0 rounded-full border-4 border-[#81b29a]/20"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-[#81b29a] border-t-transparent animate-spin"></div>
                                        <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-[#81b29a] animate-pulse" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-medium text-[#3d405b]">{status}</h3>
                                        <p className="text-sm text-[#3d405b]/60">This usually takes about 30-60 seconds.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-[#81b29a]/30 bg-white shadow-lg h-full">
                            <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
                                <div className="text-center space-y-4 opacity-50">
                                    <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                                        <ImageIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="text-[#3d405b]">Upload assets to generate creatives...</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
