import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata } from "next"
import { Geist_Mono, Outfit, Oxanium } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const oxaniumHeading = Oxanium({ subsets: ["latin"], variable: "--font-heading" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: { default: "Launchpad", template: "%s · Launchpad" },
  description: "Basha DevOps Club hackathon platform",
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
        {/* Without Clerk keys (only the dev /preview route works then), skip the provider. */}
        {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <ClerkProvider>{app}</ClerkProvider> : app}
      </body>
    </html>
  )
}
