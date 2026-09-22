import { SiteBackground } from "@/components/SiteBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { appOriginUrl } from "@/lib/utils/origin";
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import Link from "next/link";
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
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable}`}
    >
      <body>
        <SiteBackground />

        <SiteHeader />

        {children}

        <footer className={styles.legal}>
          <span>
            Forged from public onchain history. Built for entertainment, never
            financial advice.
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
