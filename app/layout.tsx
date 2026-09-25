import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata, Viewport } from "next"
import { Geist_Mono, Outfit, Oxanium } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { isDemo } from "@/lib/demo/mode"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const oxaniumHeading = Oxanium({ subsets: ["latin"], variable: "--font-heading" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

// Every page reads live event data (and cookies), so nothing is pre-rendered at build time.
export const dynamic = "force-dynamic"

// Lets the mobile tab bar pad for the iPhone home indicator (safe-area insets).
export const viewport: Viewport = { viewportFit: "cover", themeColor: "#0b0f0c" }

export const metadata: Metadata = {
  title: { default: "Hack the Den", template: "%s · Hack the Den" },
  description: "Basha DevOps Club's AI-coding hackathon",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const app = (
    <ThemeProvider>
      {children}
      <Toaster position="top-center" />
    </ThemeProvider>
  )
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", outfit.variable, oxaniumHeading.variable)}
    >
      <body className="min-h-svh">
        {/* Local demo mode uses its own user switcher instead of Clerk. */}
        {isDemo() ? app : <ClerkProvider>{app}</ClerkProvider>}
      </body>
    </html>
  )
}
