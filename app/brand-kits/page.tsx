"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type BrandKit = {
    id: string;
    name: string;
    description?: string;
};

export default function BrandKitsPage() {
    const [kits, setKits] = useState<BrandKit[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetch("/api/brand-kits")
            .then((res) => res.json())
            .then((data) => setKits(data))
            .catch(console.error);
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-[#3d405b] tracking-tight">Brand Kits</h1>
                    <p className="text-sm text-[#3d405b]/60">Manage your brand identity and voice</p>
                </div>
                <Button
                    onClick={() => router.push("/brand-kits/new")}
                    className="bg-[#3d405b] text-white hover:bg-[#3d405b]/90 h-10 px-5 font-medium"
                >
                    Create Brand Kit
                </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {kits.map((kit, index) => (
                    <Card
                        key={kit.id}
                        className="border border-gray-200 bg-white card-hover cursor-pointer"
                        onClick={() => router.push(`/brand-kits/${kit.id}`)}
                        style={{
                            animationDelay: `${index * 100}ms`,
                        }}
                    >
                        <CardHeader className="space-y-1.5">
                            <CardTitle className="text-base font-semibold text-[#3d405b]">{kit.name}</CardTitle>
                            {kit.description && <CardDescription className="text-sm text-[#3d405b]/60 line-clamp-2">{kit.description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Button
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/brand-kits/${kit.id}/edit`);
                                }}
                                className="w-full h-9 text-sm border-gray-200 text-[#3d405b] hover:bg-gray-50"
                            >
                                Edit
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
