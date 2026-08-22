import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ERP Notification Service",
  description: "Notification management dashboard",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}