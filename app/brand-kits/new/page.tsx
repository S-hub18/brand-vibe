"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { Plus, X } from "lucide-react"

export default function NewBrandKitPage() {
    const router = useRouter()
    const { register, handleSubmit, formState: { errors } } = useForm()
    const [submitting, setSubmitting] = useState(false)
    const [paletteColors, setPaletteColors] = useState<string[]>([])

    const addPaletteColor = () => {
        setPaletteColors([...paletteColors, "#000000"])
    }

    const removePaletteColor = (index: number) => {
        setPaletteColors(paletteColors.filter((_, i) => i !== index))
    }

    const updatePaletteColor = (index: number, color: string) => {
        const updated = [...paletteColors]
        updated[index] = color
        setPaletteColors(updated)
    }

    const onSubmit = async (data: any) => {
        setSubmitting(true)
        try {
            const res = await fetch("/api/brand-kits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    values: data.values ? data.values.split(',').map((s: string) => s.trim()) : [],
                    colors: {
                        primary: data.colorPrimary,
                        secondary: data.colorSecondary,
                        accent: data.colorAccent || data.colorPrimary,
                        palette: paletteColors
                    },
                    products: []
                })
            })

            if (res.ok) {
                router.push("/brand-kits")
            }
        } catch (error) {
            console.error(error)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-[#3d405b]">
                    Create Brand Kit
                </h1>
                <p className="text-sm text-[#3d405b]/60">
                    Define your brand identity to guide AI-powered content generation
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <Card className="border border-gray-200 bg-white animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-medium text-[#3d405b]">Basic Information</CardTitle>
                        <CardDescription className="text-sm text-[#3d405b]/60">Enter your brand details below</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#3d405b]">
                                Brand Kit Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("name", { required: true })}
                                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:border-[#3d405b] focus:ring-1 focus:ring-[#3d405b] focus:outline-none"
                                placeholder="e.g. Summer Campaign 2024"
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500">This field is required</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#3d405b]">
                                Company Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("companyName", { required: true })}
                                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:border-[#3d405b] focus:ring-1 focus:ring-[#3d405b] focus:outline-none"
                                placeholder="e.g. Acme Corp"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#3d405b]">
                                Description
                            </label>
                            <textarea
                                {...register("description")}
                                className="flex min-h-[80px] w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:border-[#3d405b] focus:ring-1 focus:ring-[#3d405b] focus:outline-none resize-none"
                                placeholder="Tell us about your company and what you do..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Brand Colors */}
                <Card className="border border-gray-200 bg-white animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-medium text-[#3d405b]">Brand Colors</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#3d405b]">Primary Color *</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        {...register("colorPrimary")}
                                        className="h-10 w-14 rounded border border-gray-200 p-1 cursor-pointer"
                                        defaultValue="#000000"
                                    />
                                    <input
                                        type="text"
                                        {...register("colorPrimary")}
                                        className="flex-1 h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono focus:border-[#3d405b] focus:ring-1 focus:ring-[#3d405b] focus:outline-none"
                                        placeholder="#000000"
                                        defaultValue="#000000"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#3d405b]">Secondary Color *</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        {...register("colorSecondary")}
                                        className="h-10 w-14 rounded border border-gray-200 p-1 cursor-pointer"
                                        defaultValue="#ffffff"
                                    />
                                    <input
                                        type="text"
                                        {...register("colorSecondary")}
                                        className="flex-1 h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono focus:border-[#3d405b] focus:ring-1 focus:ring-[#3d405b] focus:outline-none"
                                        placeholder="#ffffff"
                                        defaultValue="#ffffff"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#3d405b]">Accent Color (optional)</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    {...register("colorAccent")}
                                    className="h-10 w-14 rounded border border-gray-200 p-1 cursor-pointer"
                                    defaultValue="#3b82f6"
                                />
                                <input
                                    type="text"
                                    {...register("colorAccent")}
                                    className="flex-1 h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono focus:border-[#3d405b] focus:ring-1 focus:ring-[#3d405b] focus:outline-none"
                                    placeholder="#3b82f6"
                                    defaultValue="#3b82f6"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-[#3d405b]">Additional Palette Colors</label>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={addPaletteColor}
                                    className="h-8 border-gray-200 text-[#3d405b] hover:bg-gray-50"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Color
                                </Button>
                            </div>
                            {paletteColors.length > 0 && (
                                <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    {paletteColors.map((color, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <input
                                                type="color"
                                                value={color}
                                                onChange={(e) => updatePaletteColor(index, e.target.value)}
                                                className="h-10 w-14 rounded border border-gray-200 p-1 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={color}
                                                onChange={(e) => updatePaletteColor(index, e.target.value)}
                                                className="flex-1 h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono"
                                                placeholder="#000000"
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => removePaletteColor(index)}
                                                className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {paletteColors.length === 0 && (
                                <p className="text-xs text-[#3d405b]/60">
                                    Add additional colors for your brand palette
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Voice & Values */}
                <Card className="border border-gray-200 bg-white animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-medium text-[#3d405b]">Voice & Values</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#3d405b]">Tone of Voice</label>
                            <select
                                {...register("tone")}
                                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#3d405b] focus:ring-1 focus:ring-[#3d405b] focus:outline-none"
                            >
                                <option value="Professional">Professional</option>
                                <option value="Casual">Casual</option>
                                <option value="Playful">Playful</option>
                                <option value="Luxury">Luxury</option>
                                <option value="Technical">Technical</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#3d405b]">Core Values (comma separated)</label>
                            <input
                                {...register("values")}
                                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#3d405b] focus:ring-1 focus:ring-[#3d405b] focus:outline-none"
                                placeholder="Innovation, Integrity, Customer First"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-[#3d405b] hover:bg-[#3d405b]/90 h-10 px-6 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating...
                            </span>
                        ) : (
                            "Create Brand Kit"
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="border-gray-200 text-[#3d405b] hover:bg-gray-50 h-10 px-6"
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    )
}
