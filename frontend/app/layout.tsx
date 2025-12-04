import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Soul Harvest Vault - Where Fear Drives Yield 💀',
  description: 'A Solana DeFi protocol with dynamic APY based on TVL',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-halloween-black text-white">{children}</body>
    </html>
  )
}
