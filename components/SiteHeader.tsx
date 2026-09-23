"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
    BookOpen,
    ChevronRight,
    Crown,
    Gem,
    Layers,
    Menu,
    ShieldCheck,
    Swords,
    X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./SiteHeader.module.css";

interface NavItem {
  href: string;
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/archetypes",
    label: "Archetypes",
    badge: "16 Classes",
    icon: Layers,
  },
  {
    href: "/abilities",
    label: "Abilities",
    badge: "5 Tiers",
    icon: Gem,
  },
  {
    href: "/leaderboard",
    label: "Rankings",
    badge: "Top 50",
    icon: Crown,
  },
  {
    href: "/how-it-works",
    label: "How it works",
    badge: "Methodology",
    icon: BookOpen,
  },
  {
    href: "/settings",
    label: "Privacy",
    badge: "Controls",
    icon: ShieldCheck,
  },
];

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  // Monitor scroll position to apply blurred backdrop when page is scrolled under
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the mobile drawer on route transition
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Dismiss on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when mobile menu is open to prevent scroll fighting on touch devices
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Close menu if viewport scales back up to desktop breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: reducedMotion ? 0.05 : 0.18 },
    },
    exit: {
      opacity: 0,
      transition: { duration: reducedMotion ? 0.05 : 0.15 },
    },
  };

  const panelVariants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0.05 : 0.22,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
    exit: {
      opacity: 0,
      y: reducedMotion ? 0 : -8,
      transition: { duration: reducedMotion ? 0.05 : 0.15 },
    },
  };

  const isElevated = isScrolled || isOpen;

  return (
    <div
      className={`${styles.headerWrapper} ${
        isElevated ? styles.headerScrolled : ""
      }`}
    >
      <header className={styles.siteHeader}>
        <Link href="/" className={`${styles.logo} flex items-center`}>
          Onchain Battle Cards
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.desktopNavLink} ${
                  active ? styles.desktopNavLinkActive : ""
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/#address"
          className={`button button--accent ${styles.headerCta}`}
        >
          Forge a card
        </Link>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className={`${styles.mobileMenuButton} ${
            isOpen ? styles.mobileMenuButtonActive : ""
          }`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation-menu"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Drawer and Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className={styles.backdrop}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              id="mobile-navigation-menu"
              className={styles.mobileMenuPanel}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile site navigation"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <nav
                className={styles.mobileNavList}
                aria-label="Mobile navigation"
              >
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${styles.mobileNavItem} ${
                        active ? styles.mobileNavItemActive : ""
                      }`}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className={styles.mobileNavItemContent}>
                        <span className={styles.mobileNavIcon}>
                          <Icon size={18} />
                        </span>
                        <span>{item.label}</span>
                      </span>

                      <span className={styles.mobileNavMeta}>
                        <span className={styles.mobileNavBadge}>
                          {item.badge}
                        </span>
                        <ChevronRight
                          size={16}
                          className={styles.mobileNavArrow}
                        />
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <div className={styles.mobileMenuCta}>
                <Link
                  href="/"
                  className="button button--accent w-full text-xs"
                  onClick={() => setIsOpen(false)}
                >
                  <Swords size={15} />
                  <span>Forge or Lookup Card</span>
                </Link>

                <div className={styles.mobileFooterNote}>
                  <span>Onchain Battle Cards</span>
                  <span>Public Onchain Heuristics</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
