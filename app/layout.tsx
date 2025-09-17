import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { RealTimeProvider } from "@/components/real-time-provider"
import { ToastProvider } from "@/components/toast-provider"
import { NotificationProvider } from "@/components/notification-provider"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "DeLuxe Isa",
  description: "Plataforma premium de conteúdo exclusivo",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`font-sans ${poppins.variable} ${inter.variable} antialiased`}>
        <ToastProvider>
          <RealTimeProvider>
            <NotificationProvider>
              <Suspense fallback={null}>{children}</Suspense>
            </NotificationProvider>
          </RealTimeProvider>
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  )
}
