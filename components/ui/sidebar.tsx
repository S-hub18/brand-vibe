"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Palette,
    Image as ImageIcon,
    PenTool,
    Settings,
    Sparkles,
    MapPin
} from "lucide-react"

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/",
        color: "text-[#e07a5f]",
    },
    {
        label: "Brand Kits",
        icon: Palette,
        href: "/brand-kits",
        color: "text-[#e07a5f]",
    },
    {
        label: "Poster Designer",
        icon: ImageIcon,
        href: "/poster/new",
        color: "text-[#e07a5f]",
    },
    {
        label: "Content Generator",
        icon: PenTool,
        href: "/generate",
        color: "text-[#e07a5f]",
    },
    {
        label: "Billboard Analyzer",
        icon: MapPin,
        href: "/billboard-analyzer",
        color: "text-[#e07a5f]",
    },
    {
        label: "AI Studio",
        icon: Sparkles,
        href: "/studio",
        color: "text-[#e07a5f]",
        badge: "H-003",
    },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="space-y-6 py-8 flex flex-col h-full bg-white border-r border-[#81b29a]/30 shadow-lg">
            <div className="px-6 py-2 flex-1">
                {/* Logo Section */}
                <Link href="/" className="flex items-center mb-10 group">
                    <div className="relative w-10 h-10 mr-3">
                        {/* Icon Background */}
                        <div className="absolute inset-0 bg-[#e07a5f] rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200 shadow-lg">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-[#3d405b] tracking-tight">
                        BrandVibe
                    </h1>
                </Link>

                {/* Navigation Links */}
                <nav className="space-y-2">
                    {routes.map((route) => {
                        const isActive = pathname === route.href
                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "group relative flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-200",
                                    isActive
                                        ? "text-[#3d405b] bg-[#f2cc8f]/30 shadow-sm"
                                        : "text-[#3d405b]/60 hover:text-[#e07a5f] hover:bg-[#f4f1de]"
                                )}
                            >
                                {/* Active Indicator */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-[#e07a5f] rounded-r-full shadow-lg" />
                                )}

                                {/* Icon */}
                                <route.icon
                                    className={cn(
                                        "h-5 w-5 transition-all duration-200",
                                        isActive
                                            ? "text-[#e07a5f]"
                                            : "text-[#81b29a] group-hover:text-[#e07a5f] group-hover:scale-110"
                                    )}
                                />

                                {/* Label */}
                                <span className="text-sm font-medium">
                                    {route.label}
                                </span>

                                {/* Badge (if exists) */}
                                {(route as any).badge && (
                                    <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-[#e07a5f] text-white">
                                        {(route as any).badge}
                                    </span>
                                )}

                                {/* Hover Effect */}
                                {!isActive && (
                                    <div className="absolute inset-0 bg-[#f4f1de]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                                )}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Divider */}
            <div className="px-6">
                <div className="h-px bg-[#81b29a]/30" />
            </div>

        </div>
    )
}
