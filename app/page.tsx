"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
    Palette,
    Image as ImageIcon,
    PenTool,
    ArrowRight,
    Sparkles
} from "lucide-react"
import { useRouter } from "next/navigation"

const tools = [
    {
        label: "Brand Kits",
        icon: Palette,
        href: "/brand-kits",
        color: "text-[#e07a5f]",
        bgColor: "bg-[#e07a5f]/10",
        description: "Manage your brand identity, colors, and voice."
    },
    {
        label: "Poster Designer",
        icon: ImageIcon,
        href: "/poster/new",
        color: "text-[#81b29a]",
        bgColor: "bg-[#81b29a]/10",
        description: "Create stunning posters and banners with AI."
    },
    {
        label: "Content Generator",
        icon: PenTool,
        href: "/generate",
        color: "text-[#f2cc8f]",
        bgColor: "bg-[#f2cc8f]/10",
        description: "Generate engaging social media posts."
    },
]

export default function DashboardPage() {
    const router = useRouter()

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-[#3d405b] tracking-tight">
                    Welcome back
                </h1>
                <p className="text-[#3d405b]/70 text-base">
                    What would you like to create today?
                </p>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {tools.map((tool, index) => (
                    <Card
                        key={tool.href}
                        onClick={() => router.push(tool.href)}
                        className="group relative p-6 border-[#81b29a]/30 bg-white card-hover cursor-pointer overflow-hidden"
                        style={{
                            animationDelay: `${index * 100}ms`,
                        }}
                    >
                        {/* Subtle Background Pattern */}
                        <div className="absolute inset-0 bg-[#f4f1de]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="relative space-y-4">
                            {/* Icon and Title */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-x-4">
                                    <div className={cn(
                                        "p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
                                        tool.bgColor
                                    )}>
                                        <tool.icon className={cn("w-6 h-6", tool.color)} />
                                    </div>
                                    <h3 className="font-semibold text-lg text-[#3d405b]">
                                        {tool.label}
                                    </h3>
                                </div>
                                <ArrowRight className="w-5 h-5 text-[#81b29a]/40 group-hover:text-[#e07a5f] group-hover:translate-x-1 transition-all duration-300" />
                            </div>

                            {/* Description */}
                            <p className="text-[#3d405b]/70 text-sm leading-relaxed">
                                {tool.description}
                            </p>

                            {/* Footer */}
                            <div className="pt-2 border-t border-[#81b29a]/20">
                                <span className="text-xs font-medium text-[#81b29a] group-hover:text-[#e07a5f] transition-colors">
                                    Get Started →
                                </span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Pro Tip Card */}
            <div className="relative p-6 md:p-8 rounded-2xl bg-[#e07a5f] text-white shadow-elegant-xl overflow-hidden group">
                <div className="relative z-10 space-y-4">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30">
                        <Sparkles className="w-4 h-4 text-[#f2cc8f]" />
                        <span className="font-semibold text-white text-xs uppercase tracking-wider">
                            Pro Tip
                        </span>
                    </div>

                    <div className="max-w-2xl">
                        <h3 className="text-2xl font-bold mb-3">
                            Optimize your Brand Kit
                        </h3>
                        <p className="text-white/90 leading-relaxed mb-6">
                            Adding detailed values, product descriptions, and multiple brand colors helps our AI generate significantly better, more on-brand content.
                        </p>
                        <button
                            onClick={() => router.push('/brand-kits')}
                            className="inline-flex items-center gap-2 bg-white text-[#e07a5f] px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#f4f1de] transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            Edit Brand Kit
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Decorative Icon */}
                <div className="absolute right-8 bottom-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                    <Palette className="w-48 h-48 transform rotate-12" />
                </div>
            </div>
        </div>
    )
}
