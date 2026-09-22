import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { appOriginUrl } from "@/lib/utils/origin";
import "./globals.css";
import styles from "./layout.module.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono-stack",
  display: "swap",
});

// The site's display face for every title — an editorial serif set apart
// from the Inter body text used for everything else.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-display-face",
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
  themeColor: "#0a0a12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable}`}
    >
      <body>
        <div className={styles.arenaGrid} aria-hidden="true" />

        <header className={styles.siteHeader}>
          <Link href="/" className={`${styles.logo} flex items-center gap-2.5`}>
            <span
              aria-hidden
              className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl border-2 border-[var(--brand)] bg-[var(--brand)] text-[13px] font-black text-white shadow-[0_4px_14px_rgba(61,90,255,0.45)]"
            >
              OB
            </span>
            <span>
              Onchain
              <br />
              Battle Cards
            </span>
          </Link>
          <nav>
            <Link href="/archetypes">Archetypes</Link>
            <Link href="/leaderboard">Rankings</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/settings">Privacy</Link>
          </nav>
        </header>

        {children}

        <footer className={styles.legal}>
          <span>
            Forged from public onchain history. Built for entertainment, never financial advice.
          </span>
          <span className={styles.legalLinks}>
            <Link href="/how-it-works">Methodology</Link>
            <Link href="/archetypes">Archetypes</Link>
            <Link href="/abilities">Abilities</Link>
            <Link href="/settings">Privacy</Link>
          </span>
        </footer>
      </body>
    </html>
  );
}
