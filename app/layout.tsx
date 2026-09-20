import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, JetBrains_Mono, Oswald } from "next/font/google";
import { appOriginUrl } from "@/lib/utils/origin";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono-stack",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Onchain Battle Cards",
    template: "%s · Onchain Battle Cards",
  },
  description:
    "Every wallet has a legend. Forge a collectible battle card from real onchain history and enter the arena.",
  metadataBase: appOriginUrl(),
};

export const viewport: Viewport = {
  themeColor: "#08080b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable} ${jetbrainsMono.variable}`}>
      <body>
        <header className="site-header">
          <Link href="/" className="logo">
            Onchain
            <br />
            Battle Cards
          </Link>
          <nav>
            <Link href="/leaderboard">Rankings</Link>
            <Link href="/settings">Privacy</Link>
          </nav>
        </header>

        {children}

        <footer className="legal">
          Forged from public onchain history. Built for entertainment, never financial advice.
        </footer>
      </body>
    </html>
  );
}
