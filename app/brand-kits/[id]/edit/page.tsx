"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BrandKit } from "@/types/brand";

export default function EditBrandKit() {
    const router = useRouter();
    const { id } = useParams();
    const [kit, setKit] = useState<BrandKit | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/brand-kits/${id}`)
            .then((res) => res.json())
            .then((data) => setKit(data))
            .catch(console.error);
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!kit) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/brand-kits/${kit.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(kit),
            });
            if (res.ok) {
                router.push(`/brand-kits/${kit.id}`);
            } else {
                console.error("Failed to update", await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const updateColor = (type: 'primary' | 'secondary' | 'accent', value: string) => {
        if (!kit || !kit.colors) return;
        setKit({
            ...kit,
            colors: {
                ...kit.colors,
                [type]: value
            }
        });
    };

    const addPaletteColor = () => {
        if (!kit || !kit.colors) return;
        setKit({
            ...kit,
            colors: {
                ...kit.colors,
                palette: [...(kit.colors.palette || []), "#000000"]
            }
        });
    };

    const removePaletteColor = (index: number) => {
        if (!kit || !kit.colors || !kit.colors.palette) return;
        setKit({
            ...kit,
            colors: {
                ...kit.colors,
                palette: kit.colors.palette.filter((_, i) => i !== index)
            }
        });
    };

    const updatePaletteColor = (index: number, value: string) => {
        if (!kit || !kit.colors || !kit.colors.palette) return;
        const newPalette = [...kit.colors.palette];
        newPalette[index] = value;
        setKit({
            ...kit,
            colors: {
                ...kit.colors,
                palette: newPalette
            }
        });
    };

    if (!kit) return <div className="flex items-center justify-center py-12 text-[#3d405b]/60">Loading...</div>;

    return (
        <div className="max-w-3xl space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-[#3d405b]">Edit Brand Kit</h1>
                <p className="text-sm text-[#3d405b]/60">Modify the details of your brand kit</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card className="border border-gray-200 bg-white animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-medium text-[#3d405b]">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[#3d405b]">Name</label>
                            <Input
                                value={kit.name}
                                onChange={(e) => setKit({ ...kit, name: e.target.value })}
                                required
                                className="border-gray-200 focus:border-[#3d405b] focus:ring-[#3d405b]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[#3d405b]">Description</label>
                            <Textarea
                                value={kit.description || ""}
                                onChange={(e) => setKit({ ...kit, description: e.target.value })}
                                className="border-gray-200 focus:border-[#3d405b] focus:ring-[#3d405b] min-h-[80px]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-[#3d405b]">Company Name</label>
                                <Input
                                    value={kit.companyName || ""}
                                    onChange={(e) => setKit({ ...kit, companyName: e.target.value })}
                                    className="border-gray-200 focus:border-[#3d405b] focus:ring-[#3d405b]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-[#3d405b]">Tagline</label>
                                <Input
                                    value={kit.tagline || ""}
                                    onChange={(e) => setKit({ ...kit, tagline: e.target.value })}
                                    className="border-gray-200 focus:border-[#3d405b] focus:ring-[#3d405b]"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[#3d405b]">Logo URL</label>
                            <Input
                                value={kit.logoUrl || ""}
                                onChange={(e) => setKit({ ...kit, logoUrl: e.target.value })}
                                placeholder="https://..."
                                className="border-gray-200 focus:border-[#3d405b] focus:ring-[#3d405b]"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Brand Colors */}
                {kit.colors && (
                    <Card className="border border-gray-200 bg-white animate-fade-in" style={{ animationDelay: '200ms' }}>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-medium text-[#3d405b]">Brand Colors</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-[#3d405b]">Primary</label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={kit.colors.primary || "#000000"}
                                            onChange={(e) => updateColor('primary', e.target.value)}
                                            className="w-14 h-10 p-1 border-gray-200"
                                        />
                                        <Input
                                            value={kit.colors.primary || ""}
                                            onChange={(e) => updateColor('primary', e.target.value)}
                                            placeholder="#000000"
                                            className="flex-1 border-gray-200 focus:border-[#3d405b] focus:ring-[#3d405b] font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-[#3d405b]">Secondary</label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={kit.colors.secondary || "#000000"}
                                            onChange={(e) => updateColor('secondary', e.target.value)}
                                            className="w-14 h-10 p-1 border-gray-200"
                                        />
                                        <Input
                                            value={kit.colors.secondary || ""}
                                            onChange={(e) => updateColor('secondary', e.target.value)}
                                            placeholder="#000000"
                                            className="flex-1 border-gray-200 focus:border-[#3d405b] focus:ring-[#3d405b] font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-[#3d405b]">Accent</label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={kit.colors.accent || "#000000"}
                                            onChange={(e) => updateColor('accent', e.target.value)}
                                            className="w-14 h-10 p-1 border-gray-200"
                                        />
                                        <Input
                                            value={kit.colors.accent || ""}
                                            onChange={(e) => updateColor('accent', e.target.value)}
                                            placeholder="#000000"
                                            className="flex-1 border-gray-200 focus:border-[#3d405b] focus:ring-[#3d405b] font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-[#3d405b]">Extended Palette</label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={addPaletteColor}
                                        className="h-8 border-gray-200 text-[#3d405b] hover:bg-gray-50"
                                    >
                                        Add Color
                                    </Button>
                                </div>
                                {kit.colors.palette && kit.colors.palette.length > 0 && (
                                    <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        {kit.colors.palette.map((color, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <Input
                                                    type="color"
                                                    value={color}
                                                    onChange={(e) => updatePaletteColor(index, e.target.value)}
                                                    className="w-14 h-10 p-1 border-gray-200"
                                                />
                                                <Input
                                                    value={color}
                                                    onChange={(e) => updatePaletteColor(index, e.target.value)}
                                                    className="flex-1 border-gray-200 font-mono text-sm"
                                                />
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => removePaletteColor(index)}
                                                    className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    ×
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {(!kit.colors.palette || kit.colors.palette.length === 0) && (
                                    <p className="text-xs text-[#3d405b]/60">No additional colors in palette</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-[#3d405b] text-white hover:bg-[#3d405b]/90 h-10 px-6 text-sm font-medium"
                    >
                        {submitting ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        type="button"
                        className="border-gray-200 text-[#3d405b] hover:bg-gray-50 h-10 px-6 text-sm"
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
