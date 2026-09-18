import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Oswald } from "next/font/google";
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
    "Turn any EVM wallet into a collectible battle card generated from its real onchain history. Entertainment only.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
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
          <a href="/" className="logo">
            Onchain
            <br />
            Battle Cards
          </a>
          <nav>
            <a href="/leaderboard">Leaderboard</a>
            <a href="/settings">Settings</a>
          </nav>
        </header>

        {children}

        <footer className="legal">
          Entertainment only. Stats are heuristics derived from public onchain data, not financial
          advice.
        </footer>
      </body>
    </html>
  );
}
