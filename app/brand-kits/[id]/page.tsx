"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandKit } from "@/types/brand";
import { Trash2 } from "lucide-react";

export default function BrandKitDetail() {
    const router = useRouter();
    const { id } = useParams();
    const [kit, setKit] = useState<BrandKit | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/brand-kits/${id}`)
            .then((res) => res.json())
            .then((data) => setKit(data))
            .catch(console.error);
    }, [id]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/brand-kits/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.push("/brand-kits");
            } else {
                console.error("Failed to delete brand kit");
                setDeleting(false);
            }
        } catch (error) {
            console.error("Error deleting brand kit:", error);
            setDeleting(false);
        }
    };

    if (!kit) return <div className="flex items-center justify-center py-12 text-[#3d405b]/60">Loading...</div>;

    return (
        <div className="max-w-3xl space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between animate-fade-in">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-[#3d405b]">{kit.name}</h1>
                    {kit.description && <p className="text-sm text-[#3d405b]/60">{kit.description}</p>}
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => router.push(`/brand-kits/${id}/edit`)}
                        className="bg-[#3d405b] text-white hover:bg-[#3d405b]/90 h-9 px-4 text-sm font-medium"
                    >
                        Edit
                    </Button>
                    <Button
                        onClick={() => setShowDeleteConfirm(true)}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 h-9 px-4 text-sm font-medium"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-[#3d405b] mb-2">Delete Brand Kit?</h3>
                        <p className="text-sm text-[#3d405b]/70 mb-6">
                            Are you sure you want to delete "{kit.name}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                                className="border-gray-200 text-[#3d405b] hover:bg-gray-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="bg-red-600 text-white hover:bg-red-700"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Basic Info */}
            <Card className="border border-gray-200 bg-white animate-fade-in" style={{ animationDelay: '100ms' }}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium text-[#3d405b]">Brand Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[#3d405b]/60 mb-1">Company Name</p>
                            <p className="text-[#3d405b] font-medium">{kit.companyName}</p>
                        </div>
                        <div>
                            <p className="text-[#3d405b]/60 mb-1">Tagline</p>
                            <p className="text-[#3d405b] font-medium">{kit.tagline || '—'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Colors */}
            {kit.colors && (
                <Card className="border border-gray-200 bg-white animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium text-[#3d405b]">Brand Colors</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            {kit.colors.primary && (
                                <div>
                                    <p className="text-xs text-[#3d405b]/60 mb-2">Primary</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded border border-gray-200" style={{ backgroundColor: kit.colors.primary }} />
                                        <span className="text-xs text-[#3d405b]/70 font-mono">{kit.colors.primary}</span>
                                    </div>
                                </div>
                            )}
                            {kit.colors.secondary && (
                                <div>
                                    <p className="text-xs text-[#3d405b]/60 mb-2">Secondary</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded border border-gray-200" style={{ backgroundColor: kit.colors.secondary }} />
                                        <span className="text-xs text-[#3d405b]/70 font-mono">{kit.colors.secondary}</span>
                                    </div>
                                </div>
                            )}
                            {kit.colors.accent && (
                                <div>
                                    <p className="text-xs text-[#3d405b]/60 mb-2">Accent</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded border border-gray-200" style={{ backgroundColor: kit.colors.accent }} />
                                        <span className="text-xs text-[#3d405b]/70 font-mono">{kit.colors.accent}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        {kit.colors.palette && kit.colors.palette.length > 0 && (
                            <div className="pt-3 border-t border-gray-100">
                                <p className="text-xs text-[#3d405b]/60 mb-3">Extended Palette</p>
                                <div className="flex flex-wrap gap-2">
                                    {kit.colors.palette.map((c, i) => (
                                        <div key={i} className="flex flex-col items-center gap-1.5">
                                            <div className="w-8 h-8 rounded border border-gray-200" style={{ backgroundColor: c }} />
                                            <span className="text-[10px] text-[#3d405b]/60 font-mono">{c}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Typography */}
            {kit.typography && (
                <Card className="border border-gray-200 bg-white animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium text-[#3d405b]">Typography</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div>
                            <p className="text-[#3d405b]/60 mb-1">Primary Font</p>
                            <p className="text-[#3d405b] font-medium">{kit.typography.primaryFont || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[#3d405b]/60 mb-1">Secondary Font</p>
                            <p className="text-[#3d405b] font-medium">{kit.typography.secondaryFont || '—'}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Voice & Tone */}
            {(kit.tone || kit.voiceDescriptor) && (
                <Card className="border border-gray-200 bg-white animate-fade-in" style={{ animationDelay: '400ms' }}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium text-[#3d405b]">Voice & Tone</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {kit.tone && (
                            <div>
                                <p className="text-[#3d405b]/60 mb-1">Tone</p>
                                <p className="text-[#3d405b]">{kit.tone}</p>
                            </div>
                        )}
                        {kit.voiceDescriptor && (
                            <div>
                                <p className="text-[#3d405b]/60 mb-1">Voice Descriptor</p>
                                <p className="text-[#3d405b]">{kit.voiceDescriptor}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Back Button */}
            <div className="pt-4">
                <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="border-gray-200 text-[#3d405b] hover:bg-gray-50 h-9 px-4 text-sm"
                >
                    Back
                </Button>
            </div>
        </div>
    );
}
