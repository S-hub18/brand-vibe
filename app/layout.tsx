import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Sidebar } from "@/components/ui/sidebar"

const font = Outfit({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BrandVibe - AI Brand Content Generator",
  description: "Generate on-brand content for Twitter, Instagram, and LinkedIn with AI.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={font.className}>
        <Providers>
          <div className="min-h-screen relative bg-[#f4f1de]">
            <div className="hidden h-screen md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
              <Sidebar />
            </div>
            <main className="md:pl-72 min-h-screen">
              <div className="container mx-auto px-6 py-8 max-w-7xl">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
