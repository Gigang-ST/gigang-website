import { siteContent } from "@/config"
import { pretendard } from "@/lib/fonts"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: siteContent.metadata.title,
  description: siteContent.metadata.description,
  generator: siteContent.metadata.generator,
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body suppressHydrationWarning className={`${pretendard.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
