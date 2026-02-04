import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
// import "./globals.css"
import { AuthProvider } from "@/components/contexts/AuthContext"
import { NotificationProvider } from "@/components/contexts/NotificationContext"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Toaster } from "@/components/ui/sonner"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "REDAS | Diplomatic Missions",
  description: "Reporting Dashboard & Archiving System for Immigration Missions",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon.ico",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/nis.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <NotificationProvider>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  {children}
                </SidebarInset>
              </SidebarProvider>
              <Toaster />
            </NotificationProvider>
          </AuthProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
